import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Internal n8n query: GET /api/v1/knowledge-base?orgId=xxx&category=faq
// Secured by x-api-key matching N8N_WEBHOOK_SECRET for n8n callers,
// or by NextAuth session for browser callers.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const apiKey = req.headers.get("x-api-key");
  const isInternalCaller = apiKey === process.env.N8N_WEBHOOK_SECRET;

  let orgId: string;

  if (isInternalCaller) {
    const paramOrgId = searchParams.get("orgId");
    if (!paramOrgId) {
      return NextResponse.json({ error: "orgId required" }, { status: 400 });
    }
    orgId = paramOrgId;
  } else {
    const session = await auth();
    if (!session?.user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    orgId = session.user.organizationId;
  }

  const category = searchParams.get("category") ?? undefined;
  const search = searchParams.get("q") ?? undefined;

  const articles = await prisma.knowledgeBase.findMany({
    where: {
      organizationId: orgId,
      isActive: true,
      ...(category ? { category } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { content: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      title: true,
      content: true,
      category: true,
      tags: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ data: articles, meta: { total: articles.length } });
}
