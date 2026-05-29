"use client";

import { useState } from "react";
import { Loader2, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { removeTeamMember } from "@/actions/team";

interface RemoveUserButtonProps {
  userId: string;
  userName: string;
}

export function RemoveUserButton({ userId, userName }: RemoveUserButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (!confirm(`¿Desactivar a ${userName}? Ya no podrá acceder a la plataforma.`)) return;
    setLoading(true);
    try {
      await removeTeamMember(userId);
      toast.success("Usuario desactivado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRemove}
      disabled={loading}
      className="text-slate-400 hover:text-red-600 hover:bg-red-50"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
    </Button>
  );
}
