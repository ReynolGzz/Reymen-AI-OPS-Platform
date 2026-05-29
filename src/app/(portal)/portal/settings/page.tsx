import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function PortalSettingsPage() {
  const session = await auth();
  if (!session?.user.organizationId) return redirect("/login");

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    include: { users: { select: { name: true, email: true, role: true, isActive: true } } },
  });

  if (!org) return redirect("/login");

  return (
    <div>
      <PageHeader title="Configuración" description="Información de tu cuenta y organización" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Organización</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Nombre</span>
              <span className="font-medium">{org.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Industria</span>
              <span>{org.industry ?? "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Plan</span>
              <Badge variant="secondary" className="capitalize">{org.plan}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Cliente desde</span>
              <span>{formatDate(org.createdAt)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Usuarios</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {org.users.map((user) => (
                <div key={user.email} className="flex items-center justify-between">
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
      </div>
    </div>
  );
}
