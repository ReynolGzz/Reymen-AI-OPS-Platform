"use client";

import { useState } from "react";
import { toast } from "sonner";
import { toggleAssistant } from "@/actions/whatsapp-assistant";

interface AssistantToggleProps {
  isActive: boolean;
}

export function AssistantToggle({ isActive: initialActive }: AssistantToggleProps) {
  const [active, setActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    const next = !active;
    try {
      await toggleAssistant(next);
      setActive(next);
      toast.success(next ? "Asistente activado" : "Asistente pausado");
    } catch {
      toast.error("Error al cambiar estado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50 ${
        active ? "bg-brand-600" : "bg-slate-200"
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        active ? "translate-x-6" : "translate-x-1"
      }`} />
    </button>
  );
}
