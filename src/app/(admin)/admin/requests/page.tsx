import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { FileText } from "lucide-react";

const PRIORITY_LABELS: Record<string, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
};

const PRIORITY_VARIANT: Record<string, "secondary" | "warning" | "destructive"> = {
  low: "secondary",
  medium: "warning",
  high: "destructive",
};

async function getRequests() {
  return prisma.request.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      organization: { select: { name: true } },
    },
  });
}

export default async function AdminRequestsPage() {
  const requests = await getRequests();
  const openCount = requests.filter((r) => r.status === "OPEN").length;

  return (
    <div>
      <PageHeader
        title="Solicitudes"
        description={`${openCount} abiertas · ${requests.length} total`}
      />

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">Sin solicitudes aún</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Solicitud</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Prioridad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{req.title}</p>
                    <p className="text-xs text-slate-400 truncate max-w-[250px]">{req.description}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{req.organization.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{req.type}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={PRIORITY_VARIANT[req.priority] ?? "secondary"}>
                      {PRIORITY_LABELS[req.priority] ?? req.priority}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(req.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
