import { prisma } from "@/lib/prisma";
import { AutomationsManager } from "@/components/admin/AutomationsManager";

async function getData() {
  const [automations, orgs] = await Promise.all([
    prisma.automation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        organization: { select: { name: true, slug: true } },
        _count: { select: { events: true } },
      },
    }),
    prisma.organization.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  return { automations, orgs };
}

export default async function AdminAutomationsPage() {
  const { automations, orgs } = await getData();

  return (
    <div>
      <AutomationsManager automations={automations} orgs={orgs} />
    </div>
  );
}
