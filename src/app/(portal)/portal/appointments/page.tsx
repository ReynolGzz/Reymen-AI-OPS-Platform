import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { CreateAppointmentDialog } from "@/components/portal/CreateAppointmentDialog";
import { AppointmentStatusSelect } from "@/components/portal/AppointmentStatusSelect";
import { formatDateTime } from "@/lib/utils";
import { Calendar } from "lucide-react";

export default async function PortalAppointmentsPage() {
  const session = await auth();
  if (!session?.user.organizationId) return redirect("/login");

  const appointments = await prisma.appointment.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { startTime: "asc" },
  });

  const upcoming = appointments.filter((a) => new Date(a.startTime) >= new Date());
  const past = appointments.filter((a) => new Date(a.startTime) < new Date());

  return (
    <div>
      <PageHeader
        title="Citas"
        description={`${upcoming.length} próximas · ${past.length} pasadas`}
        actions={<CreateAppointmentDialog />}
      />

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="py-0">
            <EmptyState
              icon={Calendar}
              title="Sin citas agendadas"
              description="Las citas generadas por tus automatizaciones aparecerán aquí. También puedes agregarlas manualmente."
              action={<CreateAppointmentDialog />}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Título</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Inicio</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fin</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fuente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{apt.title}</p>
                    {apt.description && (
                      <p className="text-xs text-slate-400 truncate max-w-[200px]">{apt.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{formatDateTime(apt.startTime)}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{formatDateTime(apt.endTime)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{apt.source ?? "—"}</td>
                  <td className="px-4 py-3">
                    <AppointmentStatusSelect
                      appointmentId={apt.id}
                      currentStatus={apt.status}
                    />
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
