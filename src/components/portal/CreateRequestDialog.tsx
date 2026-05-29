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
import { createRequest } from "@/actions/requests";

const schema = z.object({
  title: z.string().min(1, "Título requerido"),
  description: z.string().min(10, "Descripción mínima de 10 caracteres"),
  type: z.enum(["support", "new_automation", "change", "question"]),
  priority: z.enum(["low", "medium", "high"]),
});

type FormData = z.infer<typeof schema>;

export function CreateRequestDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "medium" },
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => fd.append(k, v));
    try {
      await createRequest(fd);
      toast.success("Solicitud enviada exitosamente");
      reset();
      setOpen(false);
    } catch {
      toast.error("Error al enviar solicitud");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Nueva solicitud
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar solicitud al equipo Reymen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input placeholder="Descripción breve de la solicitud" {...register("title")} />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select onValueChange={(v) => setValue("type", v as FormData["type"])}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="support">Soporte</SelectItem>
                  <SelectItem value="new_automation">Nueva automatización</SelectItem>
                  <SelectItem value="change">Cambio</SelectItem>
                  <SelectItem value="question">Pregunta</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select defaultValue="medium" onValueChange={(v) => setValue("priority", v as FormData["priority"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descripción *</Label>
            <Textarea
              placeholder="Describe en detalle lo que necesitas..."
              rows={4}
              {...register("description")}
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar solicitud
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
