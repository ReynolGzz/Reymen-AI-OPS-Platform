import { redirect } from "next/navigation";
import { Layers, Zap } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { InstallTemplateButton } from "@/components/portal/InstallTemplateButton";

const INDUSTRY_LABELS: Record<string, string> = {
  clinic:      "Clínica / Salud",
  real_estate: "Inmobiliaria",
  gym:         "Gimnasio",
  legal:       "Legal",
  workshop:    "Taller",
  ecommerce:   "E-commerce",
  restaurant:  "Restaurante",
  education:   "Educación",
  general:     "General",
};

const CATEGORY_LABELS: Record<string, string> = {
  lead_capture:  "Captura de leads",
  appointments:  "Agendamiento",
  follow_up:     "Seguimiento",
  crm:           "CRM",
  retention:     "Retención",
  notifications: "Notificaciones",
  onboarding:    "Onboarding",
};

async function getTemplateMarketplace(orgId: string) {
  const [templates, installations] = await Promise.all([
    prisma.automationTemplate.findMany({
      where: { isPublished: true },
      orderBy: [{ industry: "asc" }, { name: "asc" }],
      include: {
        versions: { where: { isLatest: true }, take: 1, select: { version: true } },
        _count: { select: { installations: { where: { status: "ACTIVE" } } } },
      },
    }),
    prisma.templateInstallation.findMany({
      where: { organizationId: orgId, status: "ACTIVE" },
      select: { templateId: true },
    }),
  ]);

  const installedIds = new Set(installations.map((i) => i.templateId));
  return { templates, installedIds };
}

export default async function PortalTemplatesPage() {
  const session = await auth();
  if (!session?.user.organizationId) return redirect("/login");

  const { templates, installedIds } = await getTemplateMarketplace(session.user.organizationId);

  // Group by industry
  const grouped = templates.reduce<Record<string, typeof templates>>((acc, t) => {
    const key = t.industry;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const industryOrder = ["clinic", "real_estate", "gym", "legal", "workshop", "ecommerce", "general"];
  const orderedKeys = [
    ...industryOrder.filter((k) => grouped[k]),
    ...Object.keys(grouped).filter((k) => !industryOrder.includes(k)),
  ];

  const installedCount = installedIds.size;

  return (
    <div>
      <PageHeader
        title="Templates de Automatización"
        description={`${templates.length} templates disponibles · ${installedCount} instalados`}
      />

      <div className="mb-5 rounded-lg border border-brand-100 bg-brand-50 p-4">
        <div className="flex items-start gap-3">
          <Zap className="h-5 w-5 text-brand-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-brand-900">Templates pre-construidos por Reymen</p>
            <p className="text-sm text-brand-700 mt-0.5">
              Instala un template en un clic y activa automatizaciones probadas para tu industria.
              Cada template crea una automatización lista para conectar con tus operaciones.
            </p>
          </div>
        </div>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-0">
            <EmptyState
              icon={Layers}
              title="Sin templates disponibles aún"
              description="El equipo de Reymen está preparando templates para tu industria. Pronto estarán disponibles."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {orderedKeys.map((industry) => {
            const industryTemplates = grouped[industry] ?? [];
            return (
              <div key={industry}>
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  {industryTemplates[0]?.iconEmoji ?? "⚡"}
                  {INDUSTRY_LABELS[industry] ?? industry}
                  <Badge variant="secondary">{industryTemplates.length}</Badge>
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {industryTemplates.map((t) => {
                    const isInstalled = installedIds.has(t.id);
                    const latestVersion = t.versions[0]?.version;

                    return (
                      <Card
                        key={t.id}
                        className={`relative transition-all ${
                          isInstalled
                            ? "border-emerald-200 bg-emerald-50/30"
                            : "hover:border-brand-200 hover:shadow-sm"
                        }`}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-2xl leading-none">{t.iconEmoji}</span>
                            {isInstalled && (
                              <Badge variant="success" className="text-xs">Instalado</Badge>
                            )}
                          </div>

                          <h3 className="font-semibold text-slate-900 mb-1 leading-tight text-sm">
                            {t.name}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-3 mb-4">
                            {t.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-1.5 mb-4">
                            <Badge variant="secondary" className="text-xs">
                              {CATEGORY_LABELS[t.category] ?? t.category}
                            </Badge>
                            {latestVersion && (
                              <Badge variant="outline" className="text-xs">v{latestVersion}</Badge>
                            )}
                            {t._count.installations > 0 && (
                              <span className="text-xs text-slate-400">
                                {t._count.installations} instalaciones
                              </span>
                            )}
                          </div>

                          <InstallTemplateButton
                            templateId={t.id}
                            isInstalled={isInstalled}
                          />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
