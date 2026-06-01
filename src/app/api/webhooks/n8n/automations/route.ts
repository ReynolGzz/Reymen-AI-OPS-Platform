import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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
      eventType: "automation.event",
      payload: JSON.parse(rawBody),
      status: "PROCESSING",
    },
  });

  try {
    const payload = JSON.parse(rawBody) as {
      automationId: string;
      type: string;
      status: "SUCCESS" | "FAILED" | "PENDING";
      payload?: Record<string, unknown>;
      errorMessage?: string;
      duration?: number;
    };

    const automation = await prisma.automation.findFirst({
      where: { id: payload.automationId, organizationId: orgId },
    });

    if (!automation) throw new Error("Automation not found");

    await prisma.automationEvent.create({
      data: {
        automationId: payload.automationId,
        organizationId: orgId,
        type: payload.type,
        status: payload.status,
        payload: payload.payload as Prisma.InputJsonValue ?? undefined,
        errorMessage: payload.errorMessage,
        duration: payload.duration,
      },
    });

    // Update automation status if error
    if (payload.status === "FAILED") {
      await prisma.automation.update({
        where: { id: payload.automationId },
        data: { status: "ERROR" },
      });
    }

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
