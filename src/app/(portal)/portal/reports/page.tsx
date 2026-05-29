import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/MetricCard";
import { Users, Zap, MessageSquare, Calendar } from "lucide-react";

async function getReportData(orgId: string) {
  const [
    leadsByStatus,
    leadsBySource,
    eventsByStatus,
    appointmentsByStatus,
    totalLeads,
    totalAutomationRuns,
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
  ]);

  return { leadsByStatus, leadsBySource, eventsByStatus, appointmentsByStatus, totalLeads, totalAutomationRuns };
}

const STATUS_LABELS: Record<string, string> = {
  NEW: "Nuevos", CONTACTED: "Contactados", QUALIFIED: "Calificados",
  PROPOSAL: "Propuesta", WON: "Ganados", LOST: "Perdidos",
  SUCCESS: "Exitosos", FAILED: "Fallidos", PENDING: "Pendientes",
  SCHEDULED: "Agendadas", CONFIRMED: "Confirmadas", CANCELLED: "Canceladas",
  COMPLETED: "Completadas", NO_SHOW: "No asistieron",
};

export default async function PortalReportsPage() {
  const session = await auth();
  if (!session?.user.organizationId) return redirect("/login");

  const data = await getReportData(session.user.organizationId);
  const wonLeads = data.leadsByStatus.find((l) => l.status === "WON")?._count.id ?? 0;
  const conversionRate = data.totalLeads > 0 ? Math.round((wonLeads / data.totalLeads) * 100) : 0;

  return (
    <div>
      <PageHeader title="Reportes" description="Análisis de rendimiento de tus operaciones" />

      <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
        <MetricCard title="Leads totales" value={data.totalLeads} icon={Users} />
        <MetricCard title="Leads ganados" value={wonLeads} icon={Users} iconClassName="bg-emerald-50" />
        <MetricCard title="Tasa de conversión" value={`${conversionRate}%`} icon={Users} />
        <MetricCard title="Ejecuciones totales" value={data.totalAutomationRuns} icon={Zap} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Leads por estado</CardTitle></CardHeader>
          <CardContent>
            {data.leadsByStatus.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Sin datos</p>
            ) : (
              <div className="space-y-3">
                {data.leadsByStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{STATUS_LABELS[item.status] ?? item.status}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand-500"
                          style={{ width: `${(item._count.id / data.totalLeads) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-8 text-right">{item._count.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Leads por fuente</CardTitle></CardHeader>
          <CardContent>
            {data.leadsBySource.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Sin datos</p>
            ) : (
              <div className="space-y-3">
                {data.leadsBySource.map((item) => (
                  <div key={item.source ?? "unknown"} className="flex justify-between text-sm">
                    <span className="text-slate-600 capitalize">{item.source ?? "Sin fuente"}</span>
                    <span className="font-semibold">{item._count.id}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Eventos de automatización</CardTitle></CardHeader>
          <CardContent>
            {data.eventsByStatus.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Sin datos</p>
            ) : (
              <div className="space-y-3">
                {data.eventsByStatus.map((item) => (
                  <div key={item.status} className="flex justify-between text-sm">
                    <span className="text-slate-600">{STATUS_LABELS[item.status] ?? item.status}</span>
                    <span className="font-semibold">{item._count.id}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Citas por estado</CardTitle></CardHeader>
          <CardContent>
            {data.appointmentsByStatus.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Sin datos</p>
            ) : (
              <div className="space-y-3">
                {data.appointmentsByStatus.map((item) => (
                  <div key={item.status} className="flex justify-between text-sm">
                    <span className="text-slate-600">{STATUS_LABELS[item.status] ?? item.status}</span>
                    <span className="font-semibold">{item._count.id}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
