import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GitBranch, Users, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AddVersionDialog } from "@/components/admin/AddVersionDialog";
import { PublishTemplateButton } from "@/components/admin/PublishTemplateButton";
import { InstallForClientDialog } from "@/components/admin/InstallForClientDialog";
import { formatDate } from "@/lib/utils";

const INDUSTRY_LABELS: Record<string, string> = {
  clinic: "Clínica / Salud", real_estate: "Inmobiliaria", gym: "Gimnasio",
  legal: "Legal", workshop: "Taller", ecommerce: "E-commerce",
  restaurant: "Restaurante", education: "Educación", general: "General",
};

const INSTALL_STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2 }> = {
  ACTIVE: { label: "Activo", icon: CheckCircle2 },
  PENDING: { label: "Pendiente", icon: AlertCircle },
  FAILED: { label: "Fallido", icon: AlertCircle },
  UNINSTALLED: { label: "Desinstalado", icon: AlertCircle },
  INSTALLING: { label: "Instalando", icon: AlertCircle },
};

async function getTemplate(templateId: string) {
  return prisma.automationTemplate.findUnique({
    where: { id: templateId },
    include: {
      versions: { orderBy: { createdAt: "desc" } },
      installations: {
        include: {
          organization: { select: { id: true, name: true } },
          version: { select: { version: true } },
        },
        orderBy: { installedAt: "desc" },
      },
    },
  });
}

async function getClients() {
  return prisma.organization.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const [template, clients] = await Promise.all([getTemplate(templateId), getClients()]);
  if (!template) notFound();

  const activeInstalls = template.installations.filter((i) => i.status === "ACTIVE").length;

  return (
    <div>
      <div className="mb-4">
        <Link href="/admin/templates" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Volver a templates
        </Link>
      </div>

      <PageHeader
        title={`${template.iconEmoji} ${template.name}`}
        description={`${INDUSTRY_LABELS[template.industry] ?? template.industry} · ${template.category}`}
        actions={
          <div className="flex items-center gap-2">
            <PublishTemplateButton templateId={template.id} isPublished={template.isPublished} />
            {template.versions.length > 0 && (
              <InstallForClientDialog
                templateId={template.id}
                templateName={template.name}
                clients={clients}
                versions={template.versions}
              />
            )}
          </div>
        }
      />

      {/* Info bar */}
      <div className="mb-6 grid grid-cols-4 gap-3">
        {[
          { label: "Estado", value: template.isPublished ? "Publicado" : "Borrador" },
          { label: "Versión actual", value: template.currentVersion ? `v${template.currentVersion}` : "Sin versiones" },
          { label: "Versiones", value: template.versions.length },
          { label: "Instalaciones activas", value: activeInstalls },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="p-4 text-center">
              <p className="text-lg font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Versions */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Versiones
            </CardTitle>
            <AddVersionDialog
              templateId={template.id}
              templateName={template.name}
              currentVersion={template.currentVersion}
            />
          </CardHeader>
          <CardContent>
            {template.versions.length === 0 ? (
              <div className="py-8 text-center">
                <GitBranch className="mx-auto h-8 w-8 text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">
                  Sin versiones. Añade la primera para poder publicar y instalar.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {template.versions.map((v) => (
                  <div
                    key={v.id}
                    className={`rounded-lg border p-3 ${
                      v.isLatest ? "border-brand-200 bg-brand-50" : "border-slate-100"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">v{v.version}</span>
                          {v.isLatest && <Badge variant="default">Última</Badge>}
                        </div>
                        {v.changelog && (
                          <p className="mt-1 text-xs text-slate-500">{v.changelog}</p>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">{formatDate(v.createdAt)}</span>
                    </div>
                    {v.n8nWorkflowId && (
                      <p className="mt-1 text-xs text-emerald-600">
                        ✓ Workflow n8n: {v.n8nWorkflowId}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Installations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Instalaciones ({template.installations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {template.installations.length === 0 ? (
              <div className="py-8 text-center">
                <Download className="mx-auto h-8 w-8 text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">
                  Sin instalaciones aún. Instala este template para un cliente.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {template.installations.map((inst) => {
                  const cfg = INSTALL_STATUS_CONFIG[inst.status] ?? INSTALL_STATUS_CONFIG.PENDING;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={inst.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                    >
                      <div>
                        <Link
                          href={`/admin/clients/${inst.organization.id}`}
                          className="text-sm font-medium text-slate-900 hover:underline"
                        >
                          {inst.organization.name}
                        </Link>
                        <p className="text-xs text-slate-400">
                          v{inst.version.version} · {formatDate(inst.installedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Icon className={`h-4 w-4 ${inst.status === "ACTIVE" ? "text-emerald-500" : "text-slate-400"}`} />
                        <span className={`text-xs font-medium ${inst.status === "ACTIVE" ? "text-emerald-600" : "text-slate-500"}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        {template.longDescription && (
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Descripción detallada</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                {template.longDescription}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
