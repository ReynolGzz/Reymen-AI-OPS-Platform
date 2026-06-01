import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n-server";
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
  const [t, escalations] = await Promise.all([getServerT(), getEscalations()]);

  return (
    <div>
      <PageHeader
        title={t.adminEscalationsTitle}
        description={`${escalations.length} ${t.adminEscalationsDesc}`}
      />

      {escalations.length === 0 ? (
        <Card>
          <CardContent className="py-0">
            <EmptyState
              icon={AlertTriangle}
              title={t.adminNoEscalations}
              description={t.adminNoEscalationsDesc}
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
                        {conv.contactName ?? conv.contactPhone ?? t.unknown}
                      </p>
                      <Badge variant="secondary">{conv.organization.name}</Badge>
                    </div>
                    {conv.contactPhone && (
                      <p className="text-xs text-slate-400 mb-1">{conv.contactPhone}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{conv._count.messages} {t.adminMessagesUnit}</span>
                      <Badge variant="secondary" className="capitalize">{conv.channel}</Badge>
                      {conv.escalatedAt && (
                        <span className="text-amber-600">
                          {t.statusEscalated} {formatDateTime(conv.escalatedAt)}
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
                      {t.adminViewClient}
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
