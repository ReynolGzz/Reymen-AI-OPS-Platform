"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPrompt, updatePrompt } from "@/actions/prompts";
import type { Prompt, PromptType } from "@prisma/client";

const PROMPT_TYPE_LABELS: Record<PromptType, string> = {
  SYSTEM: "Sistema (principal)",
  GREETING: "Saludo inicial",
  LEAD_QUALIFICATION: "Calificación de leads",
  APPOINTMENT_BOOKING: "Agendamiento de citas",
  FAQ: "Preguntas frecuentes",
  ESCALATION: "Escalación",
};

const schema = z.object({
  name: z.string().min(1),
  content: z.string().min(10),
  type: z.enum(["SYSTEM", "GREETING", "LEAD_QUALIFICATION", "APPOINTMENT_BOOKING", "FAQ", "ESCALATION"]),
});

type FormData = z.infer<typeof schema>;

interface PromptDialogProps {
  prompt?: Prompt;
  mode?: "create" | "edit";
  defaultType?: PromptType;
}

export function PromptDialog({ prompt, mode = "create", defaultType }: PromptDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: prompt
      ? { name: prompt.name, content: prompt.content, type: prompt.type }
      : { type: defaultType },
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      if (mode === "edit" && prompt) {
        await updatePrompt(prompt.id, data);
        toast.success("Prompt actualizado");
      } else {
        await createPrompt(data);
        toast.success("Prompt creado");
        reset();
      }
      setOpen(false);
    } catch {
      toast.error("Error al guardar prompt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4" />
            Nuevo prompt
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Crear prompt" : "Editar prompt"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input placeholder="Prompt sistema v2" {...register("name")} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            {mode === "create" && (
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  defaultValue={defaultType}
                  onValueChange={(v) => setValue("type", v as PromptType)}
                >
                  <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROMPT_TYPE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Contenido del prompt</Label>
            <Textarea
              placeholder="Eres un asistente virtual de [empresa]. Tu objetivo es..."
              rows={10}
              className="font-mono text-xs"
              {...register("content")}
            />
            {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
            <p className="text-xs text-slate-400">
              Puedes usar variables como {`{{nombre_empresa}}`}, {`{{horario}}`}, {`{{servicios}}`}.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
