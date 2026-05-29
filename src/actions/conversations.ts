"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function escalateConversation(conversationId: string) {
  const session = await auth();
  if (!session?.user.organizationId) throw new Error("No autorizado");

  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, organizationId: session.user.organizationId },
  });
  if (!conv) throw new Error("Conversación no encontrada");
  if (conv.status !== "OPEN") throw new Error("Solo se pueden escalar conversaciones abiertas");

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { status: "ESCALATED", escalatedAt: new Date(), aiHandled: false },
  });

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
