import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bot, User, Settings } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConversationActions } from "@/components/portal/ConversationActions";
import { formatDateTime } from "@/lib/utils";

async function getConversation(id: string, orgId: string) {
  return prisma.conversation.findFirst({
    where: { id, organizationId: orgId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user.organizationId) return redirect("/login");

  const conv = await getConversation(id, session.user.organizationId);
  if (!conv) notFound();

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/portal/conversations"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a conversaciones
        </Link>
      </div>

      <PageHeader
        title={conv.contactName ?? conv.contactPhone ?? "Conversación"}
        description={`${conv.channel} · ${conv.messages.length} mensajes`}
        actions={<ConversationActions conversationId={conv.id} status={conv.status} />}
      />

      {/* Status & meta */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <StatusBadge status={conv.status} />
        <Badge variant="secondary" className="capitalize">{conv.channel}</Badge>
        {conv.aiHandled && (
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Bot className="h-3 w-3" /> Manejado por IA
          </span>
        )}
        {conv.escalatedAt && (
          <span className="text-xs text-amber-600">
            Escalado {formatDateTime(conv.escalatedAt)}
          </span>
        )}
        {conv.resolvedAt && (
          <span className="text-xs text-emerald-600">
            Resuelto {formatDateTime(conv.resolvedAt)}
          </span>
        )}
      </div>

      {/* Message thread */}
      <Card>
        <CardContent className="p-0">
          {conv.messages.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400">
              Sin mensajes en esta conversación
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {conv.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 p-4 ${
                    msg.role === "USER" ? "bg-white" : msg.role === "ASSISTANT" ? "bg-slate-50" : "bg-amber-50"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      msg.role === "USER"
                        ? "bg-slate-200 text-slate-700"
                        : msg.role === "ASSISTANT"
                        ? "bg-brand-100 text-brand-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {msg.role === "USER" ? (
                      <User className="h-4 w-4" />
                    ) : msg.role === "ASSISTANT" ? (
                      <Bot className="h-4 w-4" />
                    ) : (
                      <Settings className="h-4 w-4" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-700">
                        {msg.role === "USER"
                          ? conv.contactName ?? "Usuario"
                          : msg.role === "ASSISTANT"
                          ? "Asistente AI"
                          : "Sistema"}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatDateTime(msg.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-900 whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
