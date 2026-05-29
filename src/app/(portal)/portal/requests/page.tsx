import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { CreateRequestDialog } from "@/components/portal/CreateRequestDialog";
import { formatDate } from "@/lib/utils";
import { FileText } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  support: "Soporte",
  new_automation: "Nueva automatización",
  change: "Cambio",
  question: "Pregunta",
};

export default async function PortalRequestsPage() {
  const session = await auth();
  if (!session?.user.organizationId) return redirect("/login");

  const requests = await prisma.request.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
  });

  const openCount = requests.filter((r) => r.status === "OPEN" || r.status === "IN_PROGRESS").length;

  return (
    <div>
      <PageHeader
        title="Solicitudes"
        description={`${openCount} activas · ${requests.length} total`}
        actions={<CreateRequestDialog />}
      />

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-0">
            <EmptyState
              icon={FileText}
              title="Sin solicitudes"
              description="¿Necesitas soporte o una nueva automatización? Envíanos una solicitud."
              action={<CreateRequestDialog />}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-900">{req.title}</p>
                      <Badge variant="secondary" className="text-xs">
                        {TYPE_LABELS[req.type] ?? req.type}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 line-clamp-2">{req.description}</p>
                    <p className="mt-2 text-xs text-slate-400">{formatDate(req.createdAt)}</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
