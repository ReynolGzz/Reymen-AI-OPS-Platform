import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDateTime } from "@/lib/utils";

async function getEscalations() {
  return prisma.conversation.findMany({
    where: { status: "ESCALATED" },
    orderBy: { escalatedAt: "asc" },
    include: {
      organization: { select: { name: true, id: true } },
      _count: { select: { messages: true } },
    },
  });
}

export default async function AdminEscalationsPage() {
  const escalations = await getEscalations();

  return (
    <div>
      <PageHeader
        title="Conversaciones escaladas"
        description={`${escalations.length} conversaciones requieren atención humana`}
      />

      {escalations.length === 0 ? (
        <Card>
          <CardContent className="py-0">
            <EmptyState
              icon={AlertTriangle}
              title="Sin escalaciones activas"
              description="Todas las conversaciones están siendo manejadas por el asistente AI."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {escalations.map((conv) => (
            <Card key={conv.id} className="border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <p className="font-medium text-slate-900">
                        {conv.contactName ?? conv.contactPhone ?? "Desconocido"}
                      </p>
                      <Badge variant="secondary">{conv.organization.name}</Badge>
                    </div>
                    {conv.contactPhone && (
                      <p className="text-xs text-slate-400 mb-1">{conv.contactPhone}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{conv._count.messages} mensajes</span>
                      <Badge variant="secondary" className="capitalize">{conv.channel}</Badge>
                      {conv.escalatedAt && (
                        <span className="text-amber-600">
                          Escalado {formatDateTime(conv.escalatedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={conv.status} />
                    <Link
                      href={`/admin/clients/${conv.organization.id}`}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      Ver cliente →
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
