"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateTeamMember } from "@/actions/team";

const schema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  role: z.enum(["MANAGER", "AGENT", "VIEWER"]),
});

type FormData = z.infer<typeof schema>;

const ROLE_LABELS: Record<string, string> = {
  MANAGER: "Manager — Gestión completa",
  AGENT: "Agente — Conversaciones y leads",
  VIEWER: "Viewer — Solo lectura",
};

interface EditUserDialogProps {
  userId: string;
  userName: string;
  userRole: string;
}

export function EditUserDialog({ userId, userName, userRole }: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: userName,
      role: (["MANAGER", "AGENT", "VIEWER"].includes(userRole) ? userRole : "AGENT") as FormData["role"],
    },
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      await updateTeamMember(userId, data);
      toast.success("Usuario actualizado");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al actualizar usuario");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(value: boolean) {
    if (value) {
      reset({
        name: userName,
        role: (["MANAGER", "AGENT", "VIEWER"].includes(userRole) ? userRole : "AGENT") as FormData["role"],
      });
    }
    setOpen(value);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-brand-600 hover:bg-brand-50"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar miembro del equipo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nombre completo *</Label>
            <Input placeholder="Ana Martínez" {...register("name")} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Rol *</Label>
            <Select
              defaultValue={(["MANAGER", "AGENT", "VIEWER"].includes(userRole) ? userRole : "AGENT")}
              onValueChange={(v) => setValue("role", v as FormData["role"])}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
