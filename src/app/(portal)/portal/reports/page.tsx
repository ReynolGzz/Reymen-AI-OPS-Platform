import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/MetricCard";
import { LeadTrendChart } from "@/components/charts/LeadTrendChart";
import { LeadFunnelChart } from "@/components/charts/LeadFunnelChart";
import { AutomationHealthChart } from "@/components/charts/AutomationHealthChart";
import { RoiCalculator } from "@/components/portal/RoiCalculator";
import { Users, Zap, Calendar, TrendingUp } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  NEW: "Nuevos", CONTACTED: "Contactados", QUALIFIED: "Calificados",
  PROPOSAL: "Propuesta", WON: "Ganados", LOST: "Perdidos",
};

const FUNNEL_COLORS: Record<string, string> = {
  NEW: "#94a3b8", CONTACTED: "#60a5fa", QUALIFIED: "#818cf8",
  PROPOSAL: "#f59e0b", WON: "#10b981", LOST: "#ef4444",
};

function buildLeadTrend(leads: { createdAt: Date }[]): { date: string; total: number }[] {
  const days = 30;
  const now = new Date();
  const map = new Map<string, number>();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    map.set(key, 0);
  }

  for (const lead of leads) {
    const d = new Date(lead.createdAt);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
  }

  return Array.from(map.entries()).map(([date, total]) => ({ date, total }));
}

async function getReportData(orgId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    leadsByStatus,
    leadsBySource,
    eventsByStatus,
    appointmentsByStatus,
    totalLeads,
    totalAutomationRuns,
    recentLeads,
    confirmedAppointments,
  ] = await Promise.all([
    prisma.lead.groupBy({
      by: ["status"],
      where: { organizationId: orgId, deletedAt: null },
      _count: { id: true },
    }),
    prisma.lead.groupBy({
      by: ["source"],
      where: { organizationId: orgId, deletedAt: null },
      _count: { id: true },
    }),
    prisma.automationEvent.groupBy({
      by: ["status"],
      where: { organizationId: orgId },
      _count: { id: true },
    }),
    prisma.appointment.groupBy({
      by: ["status"],
      where: { organizationId: orgId },
      _count: { id: true },
    }),
    prisma.lead.count({ where: { organizationId: orgId, deletedAt: null } }),
    prisma.automationEvent.count({ where: { organizationId: orgId } }),
    prisma.lead.findMany({
      where: { organizationId: orgId, deletedAt: null, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.appointment.count({ where: { organizationId: orgId, status: "CONFIRMED" } }),
  ]);

  return {
    leadsByStatus, leadsBySource, eventsByStatus, appointmentsByStatus,
    totalLeads, totalAutomationRuns, recentLeads, confirmedAppointments,
  };
}

export default async function PortalReportsPage() {
  const session = await auth();
  if (!session?.user.organizationId) return redirect("/login");

  const data = await getReportData(session.user.organizationId);
  const wonLeads = data.leadsByStatus.find((l) => l.status === "WON")?._count.id ?? 0;
  const conversionRate = data.totalLeads > 0 ? Math.round((wonLeads / data.totalLeads) * 100) : 0;
  const successEvents = data.eventsByStatus.find((e) => e.status === "SUCCESS")?._count.id ?? 0;
  const failedEvents = data.eventsByStatus.find((e) => e.status === "FAILED")?._count.id ?? 0;
  const pendingEvents = data.eventsByStatus.find((e) => e.status === "PENDING")?._count.id ?? 0;

  const trendData = buildLeadTrend(data.recentLeads);
  const funnelData = data.leadsByStatus.map((item) => ({
    label: STATUS_LABELS[item.status] ?? item.status,
    count: item._count.id,
    color: FUNNEL_COLORS[item.status] ?? "#94a3b8",
  }));

  return (
    <div>
      <PageHeader title="Reportes" description="Análisis de rendimiento de tus operaciones" />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
        <MetricCard title="Leads totales" value={data.totalLeads} icon={Users} />
        <MetricCard title="Leads ganados" value={wonLeads} icon={TrendingUp} iconClassName="bg-emerald-50" />
        <MetricCard title="Conversión" value={`${conversionRate}%`} icon={Users} iconClassName="bg-brand-50" />
        <MetricCard title="Citas confirmadas" value={data.confirmedAppointments} icon={Calendar} iconClassName="bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        {/* Lead trend */}
        <Card>
          <CardHeader><CardTitle>Leads — últimos 30 días</CardTitle></CardHeader>
          <CardContent>
            <LeadTrendChart data={trendData} />
          </CardContent>
        </Card>

        {/* Lead funnel */}
        <Card>
          <CardHeader><CardTitle>Embudo de conversión</CardTitle></CardHeader>
          <CardContent>
            <LeadFunnelChart data={funnelData} />
          </CardContent>
        </Card>

        {/* Automation health */}
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

        {/* Lead by source */}
        <Card>
          <CardHeader><CardTitle>Leads por fuente</CardTitle></CardHeader>
          <CardContent>
            {data.leadsBySource.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Sin datos</p>
            ) : (
              <div className="space-y-3 pt-2">
                {data.leadsBySource
                  .sort((a, b) => b._count.id - a._count.id)
                  .map((item) => {
                    const pct = data.totalLeads > 0
                      ? Math.round((item._count.id / data.totalLeads) * 100)
                      : 0;
                    return (
                      <div key={item.source ?? "unknown"}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600 capitalize">{item.source ?? "Sin fuente"}</span>
                          <span className="font-semibold">{item._count.id} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ROI Simulator */}
      <RoiCalculator totalLeads={data.totalLeads} wonLeads={wonLeads} />
    </div>
  );
}
