import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Zap, Users, FileText, Layers } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ChangePlanDialog } from "@/components/admin/ChangePlanDialog";
import { formatDate } from "@/lib/utils";
import { PLAN_LIMITS } from "@/lib/permissions";

async function getClientDetail(clientId: string) {
  return prisma.organization.findUnique({
    where: { id: clientId },
    include: {
      users: { select: { id: true, name: true, email: true, role: true, isActive: true } },
      automations: {
        include: {
          events: { take: 5, orderBy: { createdAt: "desc" } },
        },
        orderBy: { createdAt: "desc" },
      },
      leads: {
        take: 10,
        orderBy: { createdAt: "desc" },
        where: { deletedAt: null },
      },
      requests: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
      templateInstallations: {
        include: {
          template: { select: { id: true, name: true, iconEmoji: true, industry: true } },
          version: { select: { version: true } },
        },
        orderBy: { installedAt: "desc" },
      },
      _count: { select: { leads: true, automations: true, conversations: true } },
    },
  });
}

export default async function ClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const client = await getClientDetail(clientId);
  if (!client) notFound();

  return (
    <div>
      <div className="mb-4">
        <Link href="/admin/clients" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Volver a clientes
        </Link>
      </div>

      <PageHeader
        title={client.name}
        description={`${client.slug} · ${client.industry ?? "Sin industria"}`}
        actions={
          <div className="flex items-center gap-2">
            <ChangePlanDialog orgId={client.id} currentPlan={client.plan} />
            <Badge variant={client.isActive ? "success" : "destructive"}>
              {client.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{client._count.leads}</p>
            <p className="text-xs text-slate-500 mt-1">Leads totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{client._count.automations}</p>
            <p className="text-xs text-slate-500 mt-1">Automatizaciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{client._count.conversations}</p>
            <p className="text-xs text-slate-500 mt-1">Conversaciones</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Automations */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Automatizaciones</CardTitle>
            <Zap className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            {client.automations.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Sin automatizaciones asignadas</p>
            ) : (
              <div className="space-y-3">
                {client.automations.map((auto) => (
                  <div key={auto.id} className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{auto.name}</p>
                      <p className="text-xs text-slate-400">{auto.type}</p>
                    </div>
                    <StatusBadge status={auto.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Leads recientes</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            {client.leads.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Sin leads aún</p>
            ) : (
              <div className="space-y-3">
                {client.leads.map((lead) => (
                  <div key={lead.id} className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{lead.name}</p>
                      <p className="text-xs text-slate-400">{lead.source ?? "manual"} · {formatDate(lead.createdAt)}</p>
                    </div>
                    <StatusBadge status={lead.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Users */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Usuarios</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {client.users.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{user.name ?? "Sin nombre"}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                  <Badge variant="secondary" className="capitalize">{user.role.toLowerCase()}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Requests */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Solicitudes recientes</CardTitle>
            <FileText className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            {client.requests.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Sin solicitudes</p>
            ) : (
              <div className="space-y-3">
                {client.requests.map((req) => (
                  <div key={req.id} className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{req.title}</p>
                      <p className="text-xs text-slate-400">{formatDate(req.createdAt)}</p>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Template Installations */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Templates instalados</CardTitle>
            <Layers className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            {client.templateInstallations.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Sin templates instalados</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {client.templateInstallations.map((inst) => (
                  <div
                    key={inst.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 p-3"
                  >
                    <span className="text-2xl leading-none flex-shrink-0">{inst.template.iconEmoji}</span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/templates/${inst.template.id}`}
                        className="text-sm font-medium text-slate-900 hover:underline truncate block"
                      >
                        {inst.template.name}
                      </Link>
                      <p className="text-xs text-slate-400">
                        v{inst.version.version} · {formatDate(inst.installedAt)}
                      </p>
                    </div>
                    <Badge
                      variant={inst.status === "ACTIVE" ? "success" : "secondary"}
                      className="text-xs flex-shrink-0"
                    >
                      {inst.status === "ACTIVE" ? "Activo" : inst.status}
                    </Badge>
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
