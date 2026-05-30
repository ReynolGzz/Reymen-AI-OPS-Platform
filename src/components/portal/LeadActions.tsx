"use client";

import { useState } from "react";
import { Loader2, Trash2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { updateLeadStatus, deleteLead } from "@/actions/leads";
import type { LeadStatus } from "@prisma/client";

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "NEW", label: "Nuevo" },
  { value: "CONTACTED", label: "Contactado" },
  { value: "QUALIFIED", label: "Calificado" },
  { value: "PROPOSAL", label: "Propuesta enviada" },
  { value: "WON", label: "Ganado" },
  { value: "LOST", label: "Perdido" },
];

interface LeadActionsProps {
  leadId: string;
  currentStatus: LeadStatus;
}

export function LeadActions({ leadId, currentStatus }: LeadActionsProps) {
  const [status, setStatus] = useState<LeadStatus>(currentStatus);
  const [loading, setLoading] = useState(false);

  async function handleStatusChange(newStatus: LeadStatus) {
    if (newStatus === status) return;
    setLoading(true);
    try {
      await updateLeadStatus(leadId, newStatus);
      setStatus(newStatus);
      toast.success("Estado actualizado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar este lead? La acción no se puede deshacer.")) return;
    setLoading(true);
    try {
      await deleteLead(leadId);
      toast.success("Lead eliminado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <div className="relative">
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
          disabled={loading}
          className="appearance-none rounded border border-slate-200 bg-white py-1 pl-2 pr-6 text-xs text-slate-600 focus:border-brand-400 focus:outline-none disabled:opacity-50 cursor-pointer"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
      </div>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="rounded p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
        title="Eliminar lead"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
