import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Zap } from "lucide-react";

async function getAutomations() {
  return prisma.automation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      organization: { select: { name: true, slug: true } },
      _count: { select: { events: true } },
    },
  });
}

export default async function AdminAutomationsPage() {
  const automations = await getAutomations();
  const errors = automations.filter((a) => a.status === "ERROR").length;

  return (
    <div>
      <PageHeader
        title="Automatizaciones"
        description={`${automations.length} automatizaciones · ${errors} con error`}
      />

      {automations.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Zap className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">Sin automatizaciones aún</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Automatización</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Eventos</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {automations.map((auto) => (
                <tr key={auto.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{auto.name}</p>
                    {auto.description && (
                      <p className="text-xs text-slate-400 truncate max-w-[200px]">{auto.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{auto.organization.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{auto.type}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{auto._count.events}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={auto.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(auto.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
