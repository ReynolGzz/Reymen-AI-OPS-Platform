import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/webhook-validator";

const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET ?? "";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-reymen-signature") ?? "";
  const orgId = req.headers.get("x-reymen-orgid") ?? "";

  const rawBody = await req.text();

  if (!verifyWebhookSignature(rawBody, signature, WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Store raw event first (reliability pattern)
  const webhookEvent = await prisma.webhookEvent.create({
    data: {
      organizationId: orgId,
      source: "n8n",
      eventType: "lead.created",
      payload: JSON.parse(rawBody),
      status: "PROCESSING",
    },
  });

  try {
    const payload = JSON.parse(rawBody) as {
      name: string;
      email?: string;
      phone?: string;
      source?: string;
      metadata?: Record<string, unknown>;
    };

    if (!payload.name) throw new Error("Missing lead name");

    const org = await prisma.organization.findUnique({ where: { id: orgId, isActive: true } });
    if (!org) throw new Error("Organization not found");

    await prisma.lead.create({
      data: {
        organizationId: orgId,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        source: payload.source ?? "n8n",
        metadata: payload.metadata as Prisma.InputJsonValue ?? undefined,
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
