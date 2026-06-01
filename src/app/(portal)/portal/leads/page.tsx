import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getServerT } from "@/lib/i18n-server";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { CreateLeadDialog } from "@/components/portal/CreateLeadDialog";
import { ExportLeadsButton } from "@/components/portal/ExportLeadsButton";
import { LeadTableClient } from "@/components/portal/LeadTableClient";
import { EmptyState } from "@/components/shared/EmptyState";
import { Users } from "lucide-react";

async function getLeads(orgId: string) {
  return prisma.lead.findMany({
    where: { organizationId: orgId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export default async function PortalLeadsPage() {
  const session = await auth();
  if (!session?.user.organizationId) return redirect("/login");

  const [t, leads] = await Promise.all([
    getServerT(),
    getLeads(session.user.organizationId),
  ]);

  return (
    <div>
      <PageHeader
        title={t.leadsTitle}
        description={`${leads.length} ${t.totalLeadsCount}`}
        actions={
          <div className="flex items-center gap-2">
            {leads.length > 0 && <ExportLeadsButton />}
            <CreateLeadDialog />
          </div>
        }
      />

      {leads.length === 0 ? (
        <Card>
          <CardContent className="py-0">
            <EmptyState
              icon={Users}
              title={t.noLeads}
              description={t.leadsEmptyDesc}
              action={<CreateLeadDialog />}
            />
          </CardContent>
        </Card>
      ) : (
        <LeadTableClient leads={leads} />
      )}
    </div>
  );
}
