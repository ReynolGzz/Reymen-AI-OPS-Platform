import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isWebhookAuthorized } from "@/lib/webhook-validator";

const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET ?? "";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-reymen-signature") ?? "";
  const plainSecret = req.headers.get("x-reymen-secret") ?? "";
  const orgId = req.headers.get("x-reymen-orgid") ?? "";

  const rawBody = await req.text();

  if (!isWebhookAuthorized(rawBody, signature, plainSecret, WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webhookEvent = await prisma.webhookEvent.create({
    data: {
      organizationId: orgId,
      source: "n8n",
      eventType: "conversation.message",
      payload: JSON.parse(rawBody),
      status: "PROCESSING",
    },
  });

  try {
    const payload = JSON.parse(rawBody) as {
      conversationId?: string;
      contactPhone: string;
      contactName?: string;
      channel: string;
      message: { role: "USER" | "ASSISTANT" | "SYSTEM"; content: string };
    };

    let conversation = payload.conversationId
      ? await prisma.conversation.findFirst({
          where: { id: payload.conversationId, organizationId: orgId },
        })
      : await prisma.conversation.findFirst({
          where: { organizationId: orgId, contactPhone: payload.contactPhone, status: "OPEN" },
        });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          organizationId: orgId,
          channel: payload.channel,
          contactPhone: payload.contactPhone,
          contactName: payload.contactName,
        },
      });
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: payload.message.role,
        content: payload.message.content,
      },
    });

    await prisma.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: { status: "PROCESSED", processedAt: new Date() },
    });

    return NextResponse.json({ success: true, conversationId: conversation.id });
  } catch (error) {
    await prisma.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
