import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
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

  const leads = await getLeads(session.user.organizationId);

  return (
    <div>
      <PageHeader
        title="Leads"
        description={`${leads.length} leads totales`}
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
              title="Sin leads aún"
              description="Los leads de tus automatizaciones aparecerán aquí. También puedes agregarlos manualmente."
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
