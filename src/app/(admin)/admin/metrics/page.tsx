import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/MetricCard";
import { AutomationHealthChart } from "@/components/charts/AutomationHealthChart";
import { LeadTrendChart } from "@/components/charts/LeadTrendChart";
import { Users, Zap, TrendingUp, Activity, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PLAN_LIMITS } from "@/lib/permissions";

function buildLeadTrend(leads: { createdAt: Date }[]): { date: string; total: number }[] {
  const days = 30;
  const now = new Date();
  const map = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    map.set(`${d.getMonth() + 1}/${d.getDate()}`, 0);
  }
  for (const lead of leads) {
    const d = new Date(lead.createdAt);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([date, total]) => ({ date, total }));
}

async function getGlobalMetrics() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalLeads,
    totalAutomations,
    totalClients,
    totalConversations,
    eventsByStatus,
    leadsByStatus,
    clientsByPlan,
    recentLeads,
    templateInstallations,
  ] = await Promise.all([
    prisma.lead.count({ where: { deletedAt: null } }),
    prisma.automation.count(),
    prisma.organization.count({ where: { isActive: true } }),
    prisma.conversation.count(),
    prisma.automationEvent.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.lead.groupBy({ by: ["status"], _count: { id: true }, where: { deletedAt: null } }),
    prisma.organization.groupBy({ by: ["plan"], _count: { id: true }, where: { isActive: true } }),
    prisma.lead.findMany({
      where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.templateInstallation.count({ where: { status: "ACTIVE" } }),
  ]);

  return {
    totalLeads, totalAutomations, totalClients, totalConversations,
    eventsByStatus, leadsByStatus, clientsByPlan, recentLeads, templateInstallations,
  };
}

const STATUS_LABELS: Record<string, string> = {
  NEW: "Nuevos", CONTACTED: "Contactados", QUALIFIED: "Calificados",
  PROPOSAL: "Propuesta", WON: "Ganados", LOST: "Perdidos",
};

export default async function AdminMetricsPage() {
  const metrics = await getGlobalMetrics();

  const successEvents = metrics.eventsByStatus.find((e) => e.status === "SUCCESS")?._count.id ?? 0;
  const failedEvents = metrics.eventsByStatus.find((e) => e.status === "FAILED")?._count.id ?? 0;
  const pendingEvents = metrics.eventsByStatus.find((e) => e.status === "PENDING")?._count.id ?? 0;
  const totalEvents = metrics.eventsByStatus.reduce((acc, e) => acc + e._count.id, 0);
  const wonLeads = metrics.leadsByStatus.find((l) => l.status === "WON")?._count.id ?? 0;
  const trendData = buildLeadTrend(metrics.recentLeads);

  return (
    <div>
      <PageHeader title="Métricas globales" description="Visión general de toda la plataforma" />

      <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
        <MetricCard title="Clientes activos" value={metrics.totalClients} icon={Users} iconClassName="bg-blue-50" />
        <MetricCard title="Leads totales" value={metrics.totalLeads} icon={TrendingUp} iconClassName="bg-brand-50" />
        <MetricCard title="Automatizaciones" value={metrics.totalAutomations} icon={Zap} />
        <MetricCard title="Conversaciones" value={metrics.totalConversations} icon={Activity} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader><CardTitle>Leads globales — últimos 30 días</CardTitle></CardHeader>
          <CardContent>
            <LeadTrendChart data={trendData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Salud de automatizaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AutomationHealthChart
              success={successEvents}
              failed={failedEvents}
              pending={pendingEvents}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Leads por estado (global)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.leadsByStatus.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Sin datos</p>
              ) : (
                metrics.leadsByStatus
                  .sort((a, b) => b._count.id - a._count.id)
                  .map((item) => (
                    <div key={item.status} className="flex justify-between text-sm">
                      <span className="text-slate-600">{STATUS_LABELS[item.status] ?? item.status}</span>
                      <span className="font-semibold">{item._count.id}</span>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Clientes por plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.clientsByPlan.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Sin datos</p>
              ) : (
                metrics.clientsByPlan
                  .sort((a, b) => b._count.id - a._count.id)
                  .map((item) => (
                    <div key={item.plan} className="flex items-center justify-between text-sm">
                      <Badge variant="secondary" className="capitalize">
                        {PLAN_LIMITS[item.plan]?.label ?? item.plan}
                      </Badge>
                      <span className="font-semibold">{item._count.id} clientes</span>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Resumen de eventos</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Total de eventos", value: totalEvents, color: "text-slate-900" },
                { label: "Exitosos", value: successEvents, color: "text-emerald-600" },
                { label: "Fallidos", value: failedEvents, color: "text-red-500" },
                { label: "Templates instalados", value: metrics.templateInstallations, color: "text-brand-600" },
                { label: "Leads ganados", value: wonLeads, color: "text-emerald-600" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className={`font-bold ${color}`}>{value.toLocaleString()}</span>
                </div>
              ))}
              {totalEvents > 0 && (
                <div className="mt-2">
                  <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="bg-emerald-500" style={{ width: `${(successEvents / totalEvents) * 100}%` }} />
                    <div className="bg-red-400" style={{ width: `${(failedEvents / totalEvents) * 100}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {Math.round((successEvents / totalEvents) * 100)}% tasa de éxito global
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
