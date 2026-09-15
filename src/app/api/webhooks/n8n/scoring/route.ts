import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isWebhookAuthorized } from "@/lib/webhook-validator";
import { checkRateLimit } from "@/lib/rate-limit";

const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET ?? "";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-reymen-signature") ?? "";
  const plainSecret = req.headers.get("x-reymen-secret") ?? "";
  const orgId = req.headers.get("x-reymen-orgid") ?? "";

  const rawBody = await req.text();

  if (!isWebhookAuthorized(rawBody, signature, plainSecret, WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(`webhook:scoring:${orgId}`, { limit: 120, windowMs: 60 * 1000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const webhookEvent = await prisma.webhookEvent.create({
    data: {
      organizationId: orgId,
      source: "n8n",
      eventType: "lead.scored",
      payload: parsedBody as Prisma.InputJsonValue,
      status: "PROCESSING",
    },
  });

  try {
    const payload = parsedBody as {
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
