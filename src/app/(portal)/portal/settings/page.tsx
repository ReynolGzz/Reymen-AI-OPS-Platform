import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InviteUserForm } from "@/components/portal/InviteUserForm";
import { RemoveUserButton } from "@/components/portal/RemoveUserButton";
import { formatDate } from "@/lib/utils";
import { can } from "@/lib/permissions";
import { PLAN_LIMITS } from "@/lib/permissions";
import type { UserRole } from "@prisma/client";

export default async function PortalSettingsPage() {
  const session = await auth();
  if (!session?.user.organizationId) return redirect("/login");

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    include: {
      users: {
        where: { isActive: true },
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!org) return redirect("/login");

  const canManageTeam = can(session.user.role as UserRole, "team:manage");
  const plan = PLAN_LIMITS[org.plan] ?? PLAN_LIMITS.starter;

  return (
    <div>
      <PageHeader title="Configuración" description="Información de tu cuenta y organización" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Organization info */}
        <Card>
          <CardHeader><CardTitle>Organización</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Nombre", value: org.name },
              { label: "Slug", value: org.slug },
              { label: "Industria", value: org.industry ?? "—" },
              { label: "Cliente desde", value: formatDate(org.createdAt) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-slate-500">{label}</span>
                <span className="font-medium text-slate-900">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Plan info */}
        <Card>
          <CardHeader><CardTitle>Plan actual</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Plan</span>
              <Badge variant="secondary" className="capitalize text-sm px-3">{plan.label}</Badge>
            </div>
            <div className="space-y-2">
              {[
                { label: "Leads incluidos", value: plan.leads >= 99999 ? "Ilimitados" : plan.leads.toLocaleString() },
                { label: "Usuarios", value: plan.users >= 99 ? "Ilimitados" : plan.users },
                { label: "Automatizaciones", value: plan.automations >= 99 ? "Ilimitadas" : plan.automations },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-brand-50 border border-brand-100 p-3">
              <p className="text-xs text-brand-700">
                ¿Necesitas más capacidad? Contacta a tu representante de Reymen o abre una solicitud.
              </p>
              <a href="/portal/requests" className="mt-1.5 inline-block text-xs font-medium text-brand-600 hover:underline">
                Abrir solicitud →
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Team management */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Equipo ({org.users.length} usuarios)</CardTitle>
            {canManageTeam && <InviteUserForm />}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {org.users.map((user) => {
                const isCurrentUser = user.id === session.user.id;
                const isOwner = user.role === "OWNER";
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900">
                          {user.name ?? "Sin nombre"}
                          {isCurrentUser && (
                            <span className="ml-1.5 text-xs text-slate-400">(tú)</span>
                          )}
                        </p>
                        <Badge variant={isOwner ? "default" : "secondary"} className="capitalize text-xs">
                          {user.role.toLowerCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                    {canManageTeam && !isCurrentUser && !isOwner && (
                      <RemoveUserButton userId={user.id} userName={user.name ?? user.email} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
