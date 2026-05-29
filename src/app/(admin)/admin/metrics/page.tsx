import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/MetricCard";
import { Users, Zap, TrendingUp, Activity } from "lucide-react";

async function getGlobalMetrics() {
  const [
    totalLeads,
    totalAutomations,
    totalClients,
    totalConversations,
    eventsByStatus,
    leadsByStatus,
  ] = await Promise.all([
    prisma.lead.count({ where: { deletedAt: null } }),
    prisma.automation.count(),
    prisma.organization.count({ where: { isActive: true } }),
    prisma.conversation.count(),
    prisma.automationEvent.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.lead.groupBy({
      by: ["status"],
      _count: { id: true },
      where: { deletedAt: null },
    }),
  ]);

  return { totalLeads, totalAutomations, totalClients, totalConversations, eventsByStatus, leadsByStatus };
}

export default async function AdminMetricsPage() {
  const metrics = await getGlobalMetrics();

  const successEvents = metrics.eventsByStatus.find((e) => e.status === "SUCCESS")?._count.id ?? 0;
  const failedEvents = metrics.eventsByStatus.find((e) => e.status === "FAILED")?._count.id ?? 0;
  const totalEvents = metrics.eventsByStatus.reduce((acc, e) => acc + e._count.id, 0);

  return (
    <div>
      <PageHeader title="Métricas globales" description="Visión general de toda la plataforma" />

      <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
        <MetricCard title="Clientes activos" value={metrics.totalClients} icon={Users} />
        <MetricCard title="Leads totales" value={metrics.totalLeads} icon={TrendingUp} />
        <MetricCard title="Automatizaciones" value={metrics.totalAutomations} icon={Zap} />
        <MetricCard title="Conversaciones" value={metrics.totalConversations} icon={Activity} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Eventos de automatización</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total de eventos</span>
                <span className="font-semibold">{totalEvents}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-600">Exitosos</span>
                <span className="font-semibold text-emerald-600">{successEvents}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-600">Fallidos</span>
                <span className="font-semibold text-red-600">{failedEvents}</span>
              </div>
              {totalEvents > 0 && (
                <div className="mt-4">
                  <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="bg-emerald-500 transition-all"
                      style={{ width: `${(successEvents / totalEvents) * 100}%` }}
                    />
                    <div
                      className="bg-red-500 transition-all"
                      style={{ width: `${(failedEvents / totalEvents) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {Math.round((successEvents / totalEvents) * 100)}% tasa de éxito
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leads por estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.leadsByStatus.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Sin datos aún</p>
              ) : (
                metrics.leadsByStatus.map((item) => (
                  <div key={item.status} className="flex justify-between text-sm">
                    <span className="text-slate-600">{item.status}</span>
                    <span className="font-semibold">{item._count.id}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
