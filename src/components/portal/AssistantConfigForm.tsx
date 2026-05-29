"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { upsertWhatsAppAssistant } from "@/actions/whatsapp-assistant";
import type { WhatsAppAssistant } from "@prisma/client";

const schema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  greeting: z.string().min(10, "Saludo mínimo de 10 caracteres"),
  personality: z.string().optional(),
  phoneNumber: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const ALL_CAPABILITIES = [
  { value: "lead_capture", label: "Captura de leads" },
  { value: "appointments", label: "Agendar citas" },
  { value: "faq", label: "Responder preguntas" },
  { value: "follow_up", label: "Seguimiento" },
  { value: "qualification", label: "Calificación de leads" },
  { value: "escalation", label: "Escalación a humano" },
];

interface AssistantConfigFormProps {
  assistant: WhatsAppAssistant | null;
}

export function AssistantConfigForm({ assistant }: AssistantConfigFormProps) {
  const [loading, setLoading] = useState(false);
  const [capabilities, setCapabilities] = useState<string[]>(
    assistant?.capabilities ?? []
  );

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: assistant?.name ?? "Asistente AI",
      greeting: assistant?.greeting ?? "¡Hola! Soy el asistente virtual. ¿En qué puedo ayudarte?",
      personality: assistant?.personality ?? "",
      phoneNumber: assistant?.phoneNumber ?? "",
    },
  });

  function toggleCapability(value: string) {
    setCapabilities((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  }

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      await upsertWhatsAppAssistant({ ...data, capabilities });
      toast.success("Asistente actualizado exitosamente");
    } catch {
      toast.error("Error al guardar configuración");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nombre del asistente</Label>
          <Input placeholder="Asistente AI" {...register("name")} />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Número de WhatsApp Business</Label>
          <Input placeholder="+52 55 1234 5678" {...register("phoneNumber")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Saludo inicial</Label>
        <Textarea
          placeholder="¡Hola! Soy el asistente virtual de [empresa]..."
          rows={3}
          {...register("greeting")}
        />
        {errors.greeting && <p className="text-xs text-red-500">{errors.greeting.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Personalidad / Estilo</Label>
        <Textarea
          placeholder="Ej: Soy amable, profesional y conciso. Me enfoco en entender las necesidades del cliente y ofrecer soluciones rápidas..."
          rows={3}
          {...register("personality")}
        />
        <p className="text-xs text-slate-400">Este texto se incluye en el system prompt del asistente.</p>
      </div>

      <div className="space-y-3">
        <Label>Capacidades activas</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ALL_CAPABILITIES.map((cap) => (
            <button
              key={cap.value}
              type="button"
              onClick={() => toggleCapability(cap.value)}
              className={`rounded-md border px-3 py-2 text-sm font-medium text-left transition-colors ${
                capabilities.includes(cap.value)
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cap.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar configuración
        </Button>
      </div>
    </form>
  );
}
