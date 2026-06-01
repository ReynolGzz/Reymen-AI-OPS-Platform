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
import { createAppointment } from "@/actions/appointments";
import { usePreferences } from "@/context/preferences";

const schema = z.object({
  title: z.string().min(2, "Mínimo 2 caracteres"),
  description: z.string().optional(),
  startTime: z.string().min(1, "Requerido"),
  endTime: z.string().min(1, "Requerido"),
});

type FormData = z.infer<typeof schema>;

function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function CreateAppointmentDialog() {
  const { t } = usePreferences();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      startTime: toLocalDatetimeValue(now),
      endTime: toLocalDatetimeValue(inOneHour),
    },
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      await createAppointment(data);
      toast.success(t.apptSuccessMsg);
      reset();
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.apptErrorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          {t.newAppointmentBtn}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.scheduleTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t.apptTitleLabel} *</Label>
            <Input placeholder={t.apptTitlePlaceholder} {...register("title")} />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t.apptStartLabel} *</Label>
              <Input type="datetime-local" {...register("startTime")} />
              {errors.startTime && <p className="text-xs text-red-500">{errors.startTime.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t.apptEndLabel} *</Label>
              <Input type="datetime-local" {...register("endTime")} />
              {errors.endTime && <p className="text-xs text-red-500">{errors.endTime.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t.apptNotesLabel}</Label>
            <Textarea placeholder={t.apptNotesPlaceholder} rows={2} {...register("description")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t.cancel}</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t.apptScheduleBtn}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
