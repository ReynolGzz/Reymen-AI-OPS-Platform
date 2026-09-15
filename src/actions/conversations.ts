"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notifyAdmins } from "@/lib/admin-notifications";
import { escalationAlertEmail } from "@/lib/email-templates";

export async function escalateConversation(conversationId: string) {
  const session = await auth();
  if (!session?.user.organizationId) throw new Error("No autorizado");

  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, organizationId: session.user.organizationId },
    include: { organization: { select: { name: true } } },
  });
  if (!conv) throw new Error("Conversación no encontrada");
  if (conv.status !== "OPEN") throw new Error("Solo se pueden escalar conversaciones abiertas");

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { status: "ESCALATED", escalatedAt: new Date(), aiHandled: false },
  });

  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/admin/escalations`;
  const email = escalationAlertEmail(conv.organization.name, conv.contactName ?? conv.contactPhone ?? "Un contacto", adminUrl);
  await notifyAdmins(email);

  revalidatePath(`/portal/conversations/${conversationId}`);
  revalidatePath("/portal/conversations");
  revalidatePath("/portal/whatsapp");
  return { success: true };
}

export async function resolveConversation(conversationId: string) {
  const session = await auth();
  if (!session?.user.organizationId) throw new Error("No autorizado");

  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, organizationId: session.user.organizationId },
  });
  if (!conv) throw new Error("Conversación no encontrada");

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });

  revalidatePath(`/portal/conversations/${conversationId}`);
  revalidatePath("/portal/conversations");
  revalidatePath("/portal/whatsapp");
  return { success: true };
}
