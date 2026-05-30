"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LeadScoreBadge } from "@/components/shared/LeadScoreBadge";
import { Badge } from "@/components/ui/badge";
import { LeadActions } from "@/components/portal/LeadActions";
import { formatDate } from "@/lib/utils";
import type { Lead, LeadStatus } from "@prisma/client";

const STATUS_OPTIONS: { value: LeadStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "NEW", label: "Nuevos" },
  { value: "CONTACTED", label: "Contactados" },
  { value: "QUALIFIED", label: "Calificados" },
  { value: "PROPOSAL", label: "Propuesta" },
  { value: "WON", label: "Ganados" },
  { value: "LOST", label: "Perdidos" },
];

interface LeadTableClientProps {
  leads: Lead[];
}

export function LeadTableClient({ leads }: LeadTableClientProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "ALL">("ALL");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return leads.filter((l) => {
      const matchesQuery = !q
        || l.name.toLowerCase().includes(q)
        || (l.email ?? "").toLowerCase().includes(q)
        || (l.phone ?? "").includes(q);
      const matchesStatus = statusFilter === "ALL" || l.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [leads, query, statusFilter]);

  return (
    <div>
      {/* Search + filter */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm focus:border-brand-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === opt.value
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center">
          <p className="text-sm text-slate-400">No se encontraron leads con esos filtros</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Contacto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fuente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Score AI</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fecha</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{lead.name}</p>
                    {lead.notes && (
                      <p className="text-xs text-slate-400 truncate max-w-[180px]">{lead.notes}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      {lead.email && <p className="text-xs text-slate-600">{lead.email}</p>}
                      {lead.phone && <p className="text-xs text-slate-600">{lead.phone}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{lead.source ?? "manual"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3">
                    <LeadScoreBadge score={lead.score} reason={lead.scoreReason} showTooltip />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(lead.createdAt)}</td>
                  <td className="px-4 py-3">
                    <LeadActions leadId={lead.id} currentStatus={lead.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
            {filtered.length} de {leads.length} leads
          </div>
        </div>
      )}
    </div>
  );
}
