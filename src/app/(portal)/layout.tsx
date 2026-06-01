import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { TopBar } from "@/components/shared/TopBar";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) return redirect("/login");

  const orgId = session.user.organizationId;
  if (!orgId) return redirect("/login");

  const org = await prisma.organization.findUnique({
    where: { id: orgId, isActive: true },
    select: { id: true, name: true, logoUrl: true },
  });

  if (!org) return redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <PortalSidebar orgName={org.name} orgLogoUrl={org.logoUrl} />
      <div className="flex flex-1 flex-col min-h-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
