import { redirect } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { TopBar } from "@/components/shared/TopBar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || !isAdmin(session.user.role)) return redirect("/login");

  const orgLogoUrl = session.user.organizationId
    ? (await prisma.organization.findUnique({
        where: { id: session.user.organizationId },
        select: { logoUrl: true },
      }))?.logoUrl ?? null
    : null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AdminSidebar
        adminName={session.user.name ?? "Reymen"}
        orgLogoUrl={orgLogoUrl}
        canEditLogo={!!session.user.organizationId}
      />
      <div className="flex flex-1 flex-col min-h-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
