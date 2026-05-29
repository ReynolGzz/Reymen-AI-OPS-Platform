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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/actions/admin/clients";

const schema = z.object({
  orgName: z.string().min(2, "Mínimo 2 caracteres"),
  orgIndustry: z.string().optional(),
  userName: z.string().min(2, "Mínimo 2 caracteres"),
  userEmail: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type FormData = z.infer<typeof schema>;

const INDUSTRIES = [
  { value: "clinic", label: "Clínica / Salud" },
  { value: "real_estate", label: "Inmobiliaria" },
  { value: "gym", label: "Gimnasio / Fitness" },
  { value: "legal", label: "Legal / Jurídico" },
  { value: "workshop", label: "Taller / Automotriz" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "other", label: "Otro" },
];

export function CreateClientDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => v && fd.append(k, v));
    try {
      await createClient(fd);
      toast.success("Cliente creado exitosamente");
      reset();
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al crear cliente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear nuevo cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre de empresa</Label>
            <Input placeholder="Clínica San Rafael" {...register("orgName")} />
            {errors.orgName && <p className="text-xs text-red-500">{errors.orgName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Industria</Label>
            <Select onValueChange={(v) => setValue("orgIndustry", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar industria" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((ind) => (
                  <SelectItem key={ind.value} value={ind.value}>{ind.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <hr className="border-slate-200" />

          <div className="space-y-2">
            <Label>Nombre del administrador</Label>
            <Input placeholder="Juan García" {...register("userName")} />
            {errors.userName && <p className="text-xs text-red-500">{errors.userName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Email de acceso</Label>
            <Input type="email" placeholder="juan@empresa.com" {...register("userEmail")} />
            {errors.userEmail && <p className="text-xs text-red-500">{errors.userEmail.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Contraseña inicial</Label>
            <Input type="password" placeholder="Mínimo 8 caracteres" {...register("password")} />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear cliente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
