"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { escalateConversation, resolveConversation } from "@/actions/conversations";
import type { ConversationStatus } from "@prisma/client";

interface ConversationActionsProps {
  conversationId: string;
  status: ConversationStatus;
}

export function ConversationActions({ conversationId, status }: ConversationActionsProps) {
  const [loading, setLoading] = useState<"escalate" | "resolve" | null>(null);
  const router = useRouter();

  async function handleEscalate() {
    setLoading("escalate");
    try {
      await escalateConversation(conversationId);
      toast.success("Conversación escalada al equipo humano");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al escalar");
    } finally {
      setLoading(null);
    }
  }

  async function handleResolve() {
    setLoading("resolve");
    try {
      await resolveConversation(conversationId);
      toast.success("Conversación marcada como resuelta");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al resolver");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {status === "OPEN" && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleEscalate}
          disabled={loading !== null}
          className="text-amber-600 border-amber-200 hover:bg-amber-50"
        >
          {loading === "escalate" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          Escalar a humano
        </Button>
      )}

      {(status === "OPEN" || status === "ESCALATED") && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleResolve}
          disabled={loading !== null}
          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
        >
          {loading === "resolve" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Marcar como resuelta
        </Button>
      )}
    </div>
  );
}
