"use client";

import { useState } from "react";
import { Loader2, UserMinus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { removeTeamMember } from "@/actions/team";

interface RemoveUserButtonProps {
  userId: string;
  userName: string;
}

export function RemoveUserButton({ userId, userName }: RemoveUserButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await removeTeamMember(userId);
      toast.success("Usuario desactivado");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-slate-400 hover:text-red-600 hover:bg-red-50"
      >
        <UserMinus className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desactivar usuario</DialogTitle>
          </DialogHeader>
          <div className="flex items-start gap-3 py-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{userName}</p>
              <p className="mt-1 text-sm text-slate-500">
                Este usuario ya no podrá acceder a la plataforma. Puedes reactivarlo contactando al soporte.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Desactivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
