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
import { createArticle, updateArticle } from "@/actions/knowledge-base";
import type { KnowledgeBase } from "@prisma/client";

const schema = z.object({
  title: z.string().min(1, "Título requerido"),
  content: z.string().min(1, "Contenido requerido"),
  category: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ArticleDialogProps {
  article?: KnowledgeBase;
  mode?: "create" | "edit";
}

export function ArticleDialog({ article, mode = "create" }: ArticleDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: article
      ? { title: article.title, content: article.content, category: article.category ?? "" }
      : {},
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      if (mode === "edit" && article) {
        await updateArticle(article.id, { ...data, category: data.category || undefined });
        toast.success("Artículo actualizado");
      } else {
        await createArticle({ ...data, category: data.category || undefined });
        toast.success("Artículo creado");
        reset();
      }
      setOpen(false);
    } catch {
      toast.error("Error al guardar artículo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Nuevo artículo
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Crear artículo" : "Editar artículo"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label>Título *</Label>
              <Input placeholder="¿Cuáles son los horarios de atención?" {...register("title")} />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Input placeholder="faq, precios, servicios..." {...register("category")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Contenido *</Label>
            <Textarea
              placeholder="Escribe el contenido que el asistente usará para responder..."
              rows={8}
              {...register("content")}
            />
            {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
            <p className="text-xs text-slate-400">
              Este contenido es consultado por el asistente AI para responder preguntas de los clientes.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "create" ? "Crear artículo" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
