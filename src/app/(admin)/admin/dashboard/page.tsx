import { Users, Zap, AlertTriangle, FileText, MessageSquare, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";

async function getAdminMetrics() {
  const [
    totalClients,
    activeAutomations,
    automationErrors,
    openRequests,
    recentEvents,
    recentClients,
  ] = await Promise.all([
    prisma.organization.count({ where: { isActive: true } }),
    prisma.automation.count({ where: { status: "ACTIVE" } }),
    prisma.automation.count({ where: { status: "ERROR" } }),
    prisma.request.count({ where: { status: "OPEN" } }),
    prisma.automationEvent.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { automation: { select: { name: true, organization: { select: { name: true } } } } },
    }),
    prisma.organization.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      where: { isActive: true },
      include: { _count: { select: { leads: true, automations: true } } },
    }),
  ]);

  return { totalClients, activeAutomations, automationErrors, openRequests, recentEvents, recentClients };
}

export default async function AdminDashboardPage() {
  const session = await auth();
  const metrics = await getAdminMetrics();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Bienvenido de vuelta, ${session?.user.name ?? session?.user.email}`}
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <MetricCard
          title="Clientes activos"
          value={metrics.totalClients}
          icon={Users}
          iconClassName="bg-blue-50"
        />
        <MetricCard
          title="Automatizaciones activas"
          value={metrics.activeAutomations}
          icon={Zap}
          iconClassName="bg-brand-50"
        />
        <MetricCard
          title="Errores activos"
          value={metrics.automationErrors}
          icon={AlertTriangle}
          iconClassName="bg-red-50"
        />
        <MetricCard
          title="Solicitudes abiertas"
          value={metrics.openRequests}
          icon={FileText}
          iconClassName="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle>Últimos eventos de automatización</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.recentEvents.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">Sin eventos recientes</p>
            ) : (
              <div className="space-y-3">
                {metrics.recentEvents.map((event) => (
                  <div key={event.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {event.automation.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {event.automation.organization.name} · {formatDate(event.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={event.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Clients */}
        <Card>
          <CardHeader>
            <CardTitle>Clientes recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.recentClients.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">Sin clientes aún</p>
            ) : (
              <div className="space-y-3">
                {metrics.recentClients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{client.name}</p>
                      <p className="text-xs text-slate-500">
                        {client._count.leads} leads · {client._count.automations} automatizaciones
                      </p>
                    </div>
                    <p className="text-xs text-slate-400">{formatDate(client.createdAt)}</p>
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
