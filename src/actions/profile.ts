"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import type { UserRole } from "@prisma/client";

export async function updateAvatar(imageUrl: string) {
  const session = await auth();
  if (!session?.user.id) throw new Error("No autorizado");

  const parsed = z.string().url("URL inválida").safeParse(imageUrl);
  if (!parsed.success) throw new Error("URL de imagen inválida");

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: imageUrl },
  });

  revalidatePath("/portal");
  return { success: true };
}

export async function removeAvatar() {
  const session = await auth();
  if (!session?.user.id) throw new Error("No autorizado");

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: null },
  });

  revalidatePath("/portal");
  return { success: true };
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Mínimo 8 caracteres"),
});

export async function changePassword(data: { currentPassword: string; newPassword: string }) {
  const session = await auth();
  if (!session?.user.id) throw new Error("No autorizado");

  const parsed = passwordSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !user.passwordHash) throw new Error("Usuario no encontrado");

  const isValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!isValid) throw new Error("Contraseña actual incorrecta");

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: newHash },
  });

  await logAudit({
    organizationId: session.user.organizationId ?? undefined,
    userId: session.user.id,
    action: "profile.changePassword",
    resource: "User",
    resourceId: session.user.id,
    metadata: {},
  });

  return { success: true };
}

export async function updatePreferences(data: { theme?: string; language?: string }) {
  const session = await auth();
  if (!session?.user.id) throw new Error("No autorizado");

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(data.theme !== undefined && { theme: data.theme }),
      ...(data.language !== undefined && { language: data.language }),
    },
  });

  return { success: true };
}

export async function updateOrgLogo(logoUrl: string | null) {
  const session = await auth();
  if (!session?.user.organizationId) throw new Error("No autorizado");

  const allowed: UserRole[] = ["OWNER", "ADMIN", "SUPER_ADMIN", "MANAGER"];
  if (!allowed.includes(session.user.role as UserRole)) throw new Error("Sin permisos");

  if (logoUrl) {
    const parsed = z.string().url("URL inválida").safeParse(logoUrl);
    if (!parsed.success) throw new Error("URL de logo inválida");
  }

  await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: { logoUrl: logoUrl ?? null },
  });

  await logAudit({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    action: "org.updateLogo",
    resource: "Organization",
    resourceId: session.user.organizationId,
    metadata: { logoUrl },
  });

  revalidatePath("/portal");
  return { success: true };
}

export async function getUserPreferences() {
  const session = await auth();
  if (!session?.user.id) return { theme: "light", language: "es", image: null };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { theme: true, language: true, image: true },
  });

  return {
    theme: user?.theme ?? "light",
    language: user?.language ?? "es",
    image: user?.image ?? null,
  };
}
