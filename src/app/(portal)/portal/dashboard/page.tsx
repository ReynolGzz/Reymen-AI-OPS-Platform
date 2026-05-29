import { redirect } from "next/navigation";
import { Users, Zap, MessageSquare, FileText, Calendar, AlertTriangle } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";

async function getPortalMetrics(orgId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalLeads,
    newLeadsToday,
    activeAutomations,
    automationErrors,
    openConversations,
    openRequests,
    recentLeads,
    recentEvents,
  ] = await Promise.all([
    prisma.lead.count({ where: { organizationId: orgId, deletedAt: null } }),
    prisma.lead.count({ where: { organizationId: orgId, deletedAt: null, createdAt: { gte: today } } }),
    prisma.automation.count({ where: { organizationId: orgId, status: "ACTIVE" } }),
    prisma.automation.count({ where: { organizationId: orgId, status: "ERROR" } }),
    prisma.conversation.count({ where: { organizationId: orgId, status: "OPEN" } }),
    prisma.request.count({ where: { organizationId: orgId, status: "OPEN" } }),
    prisma.lead.findMany({
      where: { organizationId: orgId, deletedAt: null },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.automationEvent.findMany({
      where: { organizationId: orgId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { automation: { select: { name: true } } },
    }),
  ]);

  return {
    totalLeads, newLeadsToday, activeAutomations, automationErrors,
    openConversations, openRequests, recentLeads, recentEvents,
  };
}

export default async function PortalDashboardPage() {
  const session = await auth();
  if (!session?.user.organizationId) return redirect("/login");

  const metrics = await getPortalMetrics(session.user.organizationId);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Bienvenido de vuelta, ${session.user.name ?? session.user.email}`}
      />

      <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard title="Leads totales" value={metrics.totalLeads} icon={Users} />
        <MetricCard
          title="Leads hoy"
          value={metrics.newLeadsToday}
          icon={Users}
          iconClassName="bg-emerald-50"
        />
        <MetricCard title="Automatizaciones" value={metrics.activeAutomations} icon={Zap} />
        <MetricCard
          title="Errores"
          value={metrics.automationErrors}
          icon={AlertTriangle}
          iconClassName="bg-red-50"
        />
        <MetricCard title="Conversaciones" value={metrics.openConversations} icon={MessageSquare} />
        <MetricCard title="Solicitudes" value={metrics.openRequests} icon={FileText} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leads recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.recentLeads.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">
                Sin leads aún. Activa tu primera automatización.
              </p>
            ) : (
              <div className="space-y-3">
                {metrics.recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{lead.name}</p>
                      <p className="text-xs text-slate-400">
                        {lead.source ?? "manual"} · {formatDate(lead.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={lead.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad de automatizaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.recentEvents.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Sin actividad reciente</p>
            ) : (
              <div className="space-y-3">
                {metrics.recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{event.automation.name}</p>
                      <p className="text-xs text-slate-400">{formatDate(event.createdAt)}</p>
                    </div>
                    <StatusBadge status={event.status} />
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
