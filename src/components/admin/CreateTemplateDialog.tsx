"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTemplate } from "@/actions/admin/templates";

export const INDUSTRIES = [
  { value: "clinic",       label: "🏥 Clínica / Salud" },
  { value: "real_estate",  label: "🏠 Inmobiliaria" },
  { value: "gym",          label: "💪 Gimnasio / Fitness" },
  { value: "legal",        label: "⚖️ Legal / Jurídico" },
  { value: "workshop",     label: "🔧 Taller / Automotriz" },
  { value: "ecommerce",    label: "🛍️ E-commerce" },
  { value: "restaurant",   label: "🍽️ Restaurante" },
  { value: "education",    label: "📚 Educación" },
  { value: "general",      label: "⚡ General" },
];

export const CATEGORIES = [
  { value: "lead_capture",   label: "Captura de leads" },
  { value: "appointments",   label: "Agendamiento" },
  { value: "follow_up",      label: "Seguimiento" },
  { value: "crm",            label: "CRM / Gestión" },
  { value: "retention",      label: "Retención" },
  { value: "notifications",  label: "Notificaciones" },
  { value: "onboarding",     label: "Onboarding" },
];

const EMOJIS = ["⚡","🤖","📋","📞","🗓️","💬","📊","🎯","🔔","✅","🚀","💡"];

const schema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  description: z.string().min(10, "Mínimo 10 caracteres"),
  longDescription: z.string().optional(),
  industry: z.string().min(1, "Selecciona una industria"),
  category: z.string().min(1, "Selecciona una categoría"),
  iconEmoji: z.string(),
});

type FormData = z.infer<typeof schema>;

export function CreateTemplateDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState("⚡");

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { iconEmoji: "⚡" },
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      await createTemplate({ ...data, iconEmoji: selectedEmoji });
      toast.success("Template creado exitosamente");
      reset();
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al crear template");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" />Nuevo template</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Crear template de automatización</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Emoji picker */}
          <div className="space-y-2">
            <Label>Ícono</Label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setSelectedEmoji(e)}
                  className={`h-9 w-9 rounded-lg border text-lg transition-colors ${
                    selectedEmoji === e
                      ? "border-brand-500 bg-brand-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input placeholder="Agendamiento de citas médicas" {...register("name")} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Industria *</Label>
              <Select onValueChange={(v) => setValue("industry", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => (
                    <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.industry && <p className="text-xs text-red-500">{errors.industry.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Categoría *</Label>
              <Select onValueChange={(v) => setValue("category", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descripción corta *</Label>
            <Input placeholder="Captura y califica leads desde WhatsApp automáticamente" {...register("description")} />
            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Descripción detallada</Label>
            <Textarea placeholder="Explicación completa de qué hace el template..." rows={3} {...register("longDescription")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear template
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
