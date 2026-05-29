import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CreateLeadDialog } from "@/components/portal/CreateLeadDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/utils";
import { Users } from "lucide-react";

async function getLeads(orgId: string) {
  return prisma.lead.findMany({
    where: { organizationId: orgId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export default async function PortalLeadsPage() {
  const session = await auth();
  if (!session?.user.organizationId) return redirect("/login");

  const leads = await getLeads(session.user.organizationId);

  return (
    <div>
      <PageHeader
        title="Leads"
        description={`${leads.length} leads totales`}
        actions={<CreateLeadDialog />}
      />

      {leads.length === 0 ? (
        <Card>
          <CardContent className="py-0">
            <EmptyState
              icon={Users}
              title="Sin leads aún"
              description="Los leads de tus automatizaciones aparecerán aquí. También puedes agregarlos manualmente."
              action={<CreateLeadDialog />}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Contacto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fuente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{lead.name}</p>
                    {lead.notes && (
                      <p className="text-xs text-slate-400 truncate max-w-[180px]">{lead.notes}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      {lead.email && <p className="text-xs text-slate-600">{lead.email}</p>}
                      {lead.phone && <p className="text-xs text-slate-600">{lead.phone}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{lead.source ?? "manual"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {formatDate(lead.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
