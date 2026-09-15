import NextAuth, { CredentialsSignin, type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./prisma";
import { checkRateLimit } from "./rate-limit";
import { verifyTotpCode } from "./totp";
import type { UserRole } from "@prisma/client";
export { isAdmin, isClientRole } from "./roles";

class RateLimitedSignin extends CredentialsSignin {
  code = "rate_limited";
}

class TwoFactorRequiredSignin extends CredentialsSignin {
  code = "totp_required";
}

class TwoFactorInvalidSignin extends CredentialsSignin {
  code = "totp_invalid";
}

async function consumeBackupCode(userId: string, code: string, hashes: string[]): Promise<boolean> {
  const normalized = code.trim().toUpperCase();
  for (const hash of hashes) {
    if (await bcrypt.compare(normalized, hash)) {
      await prisma.user.update({
        where: { id: userId },
        data: { totpBackupCodeHashes: hashes.filter((h) => h !== hash) },
      });
      return true;
    }
  }
  return false;
}

function clientIp(request?: Request): string | null {
  const forwarded = request?.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : null;
}

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
  totpCode: z.string().optional(),
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
        totpCode: { label: "Authenticator code", type: "text" },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        // URLSearchParams (used by the client signIn() call) stringifies an
        // omitted/undefined field as the literal text "undefined" — treat
        // that the same as "no code provided".
        const totpCode =
          parsed.data.totpCode && parsed.data.totpCode !== "undefined" ? parsed.data.totpCode : undefined;

        const ip = clientIp(request);
        const [emailLimit, ipLimit] = await Promise.all([
          checkRateLimit(`login:email:${email.toLowerCase()}`, { limit: 5, windowMs: 10 * 60 * 1000 }),
          ip
            ? checkRateLimit(`login:ip:${ip}`, { limit: 20, windowMs: 10 * 60 * 1000 })
            : Promise.resolve({ allowed: true }),
        ]);
        if (!emailLimit.allowed || !ipLimit.allowed) throw new RateLimitedSignin();

        const user = await prisma.user.findUnique({
          where: { email, isActive: true },
          include: { organization: { select: { isActive: true } } },
        });

        if (!user || !user.passwordHash) return null;
        if (user.organizationId && user.organization?.isActive === false) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        if (user.totpEnabled) {
          if (!totpCode) throw new TwoFactorRequiredSignin();

          const validTotp = user.totpSecret ? verifyTotpCode(user.totpSecret, totpCode) : false;
          const validBackup =
            !validTotp && (await consumeBackupCode(user.id, totpCode, user.totpBackupCodeHashes));
          if (!validTotp && !validBackup) throw new TwoFactorInvalidSignin();
        }

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
