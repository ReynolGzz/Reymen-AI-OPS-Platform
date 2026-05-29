"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Zap,
  BarChart3,
  Settings,
  MessageSquare,
  Calendar,
  FileText,
  LogOut,
  BookOpen,
  Bot,
  SlidersHorizontal,
  Layers,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/leads", label: "Leads", icon: Users },
  { href: "/portal/automations", label: "Automatizaciones", icon: Zap },
  { href: "/portal/whatsapp", label: "WhatsApp AI", icon: Bot },
  { href: "/portal/conversations", label: "Conversaciones", icon: MessageSquare },
  { href: "/portal/knowledge-base", label: "Base de Conocimiento", icon: BookOpen },
  { href: "/portal/prompts", label: "Prompts", icon: SlidersHorizontal },
  { href: "/portal/appointments", label: "Citas", icon: Calendar },
  { href: "/portal/reports", label: "Reportes", icon: BarChart3 },
  { href: "/portal/templates", label: "Templates", icon: Layers },
  { href: "/portal/requests", label: "Solicitudes", icon: FileText },
  { href: "/portal/settings", label: "Configuración", icon: Settings },
];

interface PortalSidebarProps {
  orgName: string;
  orgLogoUrl?: string | null;
}

export function PortalSidebar({ orgName, orgLogoUrl }: PortalSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      {/* Logo / Org */}
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <div className="flex items-center gap-2 min-w-0">
          {orgLogoUrl ? (
            <img src={orgLogoUrl} alt={orgName} className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 leading-none">{orgName}</p>
            <p className="text-xs text-slate-500 leading-none mt-0.5">AI Ops</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
