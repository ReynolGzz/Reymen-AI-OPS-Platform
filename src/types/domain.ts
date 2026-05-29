import type {
  Organization,
  User,
  Lead,
  Automation,
  AutomationEvent,
  Conversation,
  Appointment,
  Request,
  Metric,
  WebhookEvent,
} from "@prisma/client";

// Re-export Prisma types with display-friendly augmentations
export type { Organization, User, Lead, Automation, AutomationEvent };
export type { Conversation, Appointment, Request, Metric, WebhookEvent };

export type LeadWithOrg = Lead & { organization: Organization };
export type AutomationWithEvents = Automation & { events: AutomationEvent[] };

export interface DashboardMetrics {
  totalLeads: number;
  newLeadsToday: number;
  activeAutomations: number;
  automationErrors: number;
  openRequests: number;
  openConversations: number;
}

export interface AdminDashboardMetrics extends DashboardMetrics {
  totalClients: number;
  totalAutomations: number;
}
