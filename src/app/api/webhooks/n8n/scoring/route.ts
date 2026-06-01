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
      eventType: "lead.scored",
      payload: JSON.parse(rawBody),
      status: "PROCESSING",
    },
  });

  try {
    const payload = JSON.parse(rawBody) as {
      leadId: string;
      score: number;
      reason?: string;
    };

    if (payload.score < 0 || payload.score > 100) {
      throw new Error("Score must be between 0 and 100");
    }

    const lead = await prisma.lead.findFirst({
      where: { id: payload.leadId, organizationId: orgId, deletedAt: null },
    });
    if (!lead) throw new Error("Lead not found");

    await prisma.lead.update({
      where: { id: payload.leadId },
      data: {
        score: Math.round(payload.score),
        scoreReason: payload.reason,
      },
    });

    await prisma.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: { status: "PROCESSED", processedAt: new Date() },
    });

    return NextResponse.json({ success: true });
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
