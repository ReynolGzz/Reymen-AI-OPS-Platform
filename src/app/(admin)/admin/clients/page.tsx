import Link from "next/link";
import { ExternalLink, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateClientDialog } from "@/components/admin/CreateClientDialog";
import { formatDate } from "@/lib/utils";

async function getClients() {
  return prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { leads: true, automations: true, requests: true } },
    },
  });
}

export default async function AdminClientsPage() {
  const clients = await getClients();

  return (
    <div>
      <PageHeader
        title="Clientes"
        description={`${clients.length} organizaciones registradas`}
        actions={<CreateClientDialog />}
      />

      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-600">Sin clientes aún</p>
            <p className="text-xs text-slate-400 mt-1">Crea tu primer cliente para comenzar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Empresa</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Leads</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Automatizaciones</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Creado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{client.name}</p>
                    <p className="text-xs text-slate-400">{client.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="capitalize">{client.plan}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{client._count.leads}</td>
                  <td className="px-4 py-3 text-slate-700">{client._count.automations}</td>
                  <td className="px-4 py-3">
                    <Badge variant={client.isActive ? "success" : "destructive"}>
                      {client.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(client.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
                    >
                      Ver <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
