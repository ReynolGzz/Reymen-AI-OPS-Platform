import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ count: 0, items: [] }, { status: 401 });
  }

  const isPortal = !!session.user.organizationId;
  const orgFilter = isPortal ? { organizationId: session.user.organizationId! } : {};

  const [escalated, openRequests] = await Promise.all([
    prisma.conversation.findMany({
      where: { ...orgFilter, status: "ESCALATED" },
      take: 5,
      orderBy: { updatedAt: "desc" },
      select: { id: true, contactName: true },
    }),
    prisma.request.findMany({
      where: { ...orgFilter, status: "OPEN" },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    }),
  ]);

  const items = [
    ...escalated.map((c) => ({
      type: "escalation",
      label: "Conversación escalada",
      detail: c.contactName ?? "Sin nombre",
      href: isPortal ? "/portal/conversations" : "/admin/conversations",
    })),
    ...openRequests.map((r) => ({
      type: "request",
      label: "Solicitud abierta",
      detail: r.title,
      href: isPortal ? "/portal/requests" : "/admin/requests",
    })),
  ].slice(0, 8);

  return NextResponse.json({ count: items.length, items });
}
