import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";
import type {
  LeadStatus,
  AutomationStatus,
  RequestStatus,
  ConversationStatus,
  AppointmentStatus,
} from "@prisma/client";

type AnyStatus =
  | LeadStatus
  | AutomationStatus
  | RequestStatus
  | ConversationStatus
  | AppointmentStatus;

const STATUS_MAP: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
  // Lead
  NEW: { label: "Nuevo", variant: "info" },
  CONTACTED: { label: "Contactado", variant: "secondary" },
  QUALIFIED: { label: "Calificado", variant: "default" },
  PROPOSAL: { label: "Propuesta", variant: "warning" },
  WON: { label: "Ganado", variant: "success" },
  LOST: { label: "Perdido", variant: "destructive" },
  // Automation
  ACTIVE: { label: "Activo", variant: "success" },
  PAUSED: { label: "Pausado", variant: "secondary" },
  ERROR: { label: "Error", variant: "destructive" },
  ARCHIVED: { label: "Archivado", variant: "outline" },
  // Request
  OPEN: { label: "Abierto", variant: "info" },
  IN_PROGRESS: { label: "En progreso", variant: "warning" },
  RESOLVED: { label: "Resuelto", variant: "success" },
  CLOSED: { label: "Cerrado", variant: "secondary" },
  // Conversation
  ESCALATED: { label: "Escalado", variant: "destructive" },
  // Appointment
  SCHEDULED: { label: "Agendado", variant: "info" },
  CONFIRMED: { label: "Confirmado", variant: "success" },
  CANCELLED: { label: "Cancelado", variant: "destructive" },
  COMPLETED: { label: "Completado", variant: "success" },
  NO_SHOW: { label: "No asistió", variant: "warning" },
  // Event
  PENDING: { label: "Pendiente", variant: "warning" },
  SUCCESS: { label: "Exitoso", variant: "success" },
  FAILED: { label: "Fallido", variant: "destructive" },
  RETRYING: { label: "Reintentando", variant: "warning" },
};

interface StatusBadgeProps {
  status: AnyStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
