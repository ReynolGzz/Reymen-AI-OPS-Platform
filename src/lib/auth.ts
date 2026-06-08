import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./prisma";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      organizationId: string | null;
      theme: string;
      language: string;
      impersonating?: { adminId: string; adminName: string | null; adminEmail: string } | null;
    } & DefaultSession["user"];
  }
  interface User {
    role: UserRole;
    organizationId: string | null;
    image?: string | null;
    theme?: string | null;
    language?: string | null;
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email, isActive: true },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          organizationId: user.organizationId,
          theme: user.theme,
          language: user.language,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        if (session.image !== undefined) token.image = session.image;
        if (session.theme !== undefined) token.theme = session.theme;
        if (session.language !== undefined) token.language = session.language;
      }
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.image = user.image ?? null;
        token.theme = user.theme ?? "light";
        token.language = user.language ?? "es";
      }
      return token;
    },
    async session({ session, token }) {
      // Admins can impersonate — read cookie in server context (fails silently in Edge/middleware)
      if (token && (token.role === "SUPER_ADMIN" || token.role === "ADMIN")) {
        try {
          const { cookies } = await import("next/headers");
          const cookieStore = await cookies();
          const raw = cookieStore.get("reymen-impersonate")?.value;
          if (raw) {
            const imp = JSON.parse(raw) as {
              adminId: string; adminName: string | null; adminEmail: string;
              targetUserId: string; targetName: string | null; targetEmail: string;
              targetImage: string | null; targetRole: string; targetOrgId: string;
            };
            if (imp.adminId === (token.id as string)) {
              session.user.id = imp.targetUserId;
              session.user.name = imp.targetName;
              session.user.email = imp.targetEmail;
              session.user.image = imp.targetImage ?? null;
              session.user.role = imp.targetRole as UserRole;
              session.user.organizationId = imp.targetOrgId;
              session.user.theme = (token.theme as string) ?? "light";
              session.user.language = (token.language as string) ?? "es";
              session.user.impersonating = {
                adminId: imp.adminId,
                adminName: imp.adminName,
                adminEmail: imp.adminEmail,
              };
              return session;
            }
          }
        } catch {
          // cookies() not available in Edge runtime (middleware) — return real session below
        }
      }
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.organizationId = token.organizationId as string | null;
        session.user.image = (token.image as string | null) ?? null;
        session.user.theme = (token.theme as string) ?? "light";
        session.user.language = (token.language as string) ?? "es";
        session.user.impersonating = null;
      }
      return session;
    },
  },
});

export function isAdmin(role: UserRole): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function isClientRole(role: UserRole): boolean {
  return ["OWNER", "MANAGER", "AGENT", "VIEWER", "CLIENT"].includes(role);
}
