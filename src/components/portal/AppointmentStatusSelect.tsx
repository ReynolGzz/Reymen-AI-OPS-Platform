"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateAppointmentStatus } from "@/actions/appointments";
import type { AppointmentStatus } from "@prisma/client";

const OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: "SCHEDULED", label: "Agendada" },
  { value: "CONFIRMED", label: "Confirmada" },
  { value: "COMPLETED", label: "Completada" },
  { value: "CANCELLED", label: "Cancelada" },
  { value: "NO_SHOW", label: "No asistió" },
];

export function AppointmentStatusSelect({
  appointmentId,
  currentStatus,
}: {
  appointmentId: string;
  currentStatus: AppointmentStatus;
}) {
  const [status, setStatus] = useState<AppointmentStatus>(currentStatus);
  const [loading, setLoading] = useState(false);

  async function handleChange(newStatus: AppointmentStatus) {
    if (newStatus === status) return;
    setLoading(true);
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      setStatus(newStatus);
      toast.success("Estado actualizado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value as AppointmentStatus)}
      disabled={loading}
      className="rounded border border-slate-200 bg-white py-1 px-2 text-xs text-slate-600 focus:border-brand-400 focus:outline-none disabled:opacity-50 cursor-pointer"
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
