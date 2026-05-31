import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

async function getSystemStats() {
  const [totalOrgs, totalUsers, totalLeads, totalAutomations, totalTemplates, activeInstallations] = await Promise.all([
    prisma.organization.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.lead.count({ where: { deletedAt: null } }),
    prisma.automation.count(),
    prisma.automationTemplate.count({ where: { isPublished: true } }),
    prisma.templateInstallation.count({ where: { status: "ACTIVE" } }),
  ]);
  return { totalOrgs, totalUsers, totalLeads, totalAutomations, totalTemplates, activeInstallations };
}

export default async function AdminSettingsPage() {
  const session = await auth();
  const stats = await getSystemStats();

  return (
    <div>
      <PageHeader title="Configuración del sistema" description="Estado de la plataforma Reymen AI Ops" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Estadísticas del sistema</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Organizaciones activas", value: stats.totalOrgs },
              { label: "Usuarios activos", value: stats.totalUsers },
              { label: "Leads totales", value: stats.totalLeads.toLocaleString("en-US") },
              { label: "Automatizaciones", value: stats.totalAutomations },
              { label: "Templates publicados", value: stats.totalTemplates },
              { label: "Instalaciones activas", value: stats.activeInstallations },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{label}</span>
                <span className="font-bold text-slate-900">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Sesión actual</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Usuario", value: session?.user.name ?? "—" },
              { label: "Email", value: session?.user.email ?? "—" },
              { label: "Rol", value: <Badge variant="secondary" className="capitalize">{session?.user.role?.toLowerCase()}</Badge> },
              { label: "ID", value: <span className="font-mono text-xs text-slate-400">{session?.user.id?.slice(-12)}</span> },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{label}</span>
                <span className="font-medium text-slate-900">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Variables de entorno requeridas</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-lg bg-slate-950 p-4 font-mono text-xs text-slate-300 space-y-1">
              {[
                "DATABASE_URL",
                "AUTH_SECRET",
                "N8N_BASE_URL",
                "N8N_WEBHOOK_SECRET",
                "WEBHOOK_SECRET",
                "KNOWLEDGE_BASE_API_KEY",
              ].map((key) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-brand-400">{key}</span>
                  <span className="text-slate-500">=</span>
                  <span className="text-slate-400">{"*".repeat(16)}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Configura estas variables en tu archivo <code className="font-mono bg-slate-100 px-1 rounded">.env</code> o en tu proveedor de hosting.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
