"use client";

import { useState, useEffect } from "react";
import { Bell, LogOut, MessageSquare, FileText } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface NotificationItem {
  type: string;
  label: string;
  detail: string;
  href: string;
}

interface NotificationsData {
  count: number;
  items: NotificationItem[];
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return (email?.[0] ?? "U").toUpperCase();
}

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<NotificationsData>({ count: 0, items: [] });

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data: NotificationsData) => setNotifications(data))
      .catch(() => {});
  }, []);

  const initials = getInitials(session?.user?.name, session?.user?.email);

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      {title && <p className="text-sm text-slate-500">{title}</p>}

      <div className="ml-auto flex items-center gap-2">
        {/* Notification bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none">
              <Bell className="h-4 w-4" />
              {notifications.count > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
                  {notifications.count > 9 ? "9+" : notifications.count}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="text-xs font-semibold text-slate-700 px-3 py-2">
              Notificaciones
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.items.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-slate-400">
                Sin notificaciones
              </div>
            ) : (
              notifications.items.map((item, i) => (
                <DropdownMenuItem key={i} asChild>
                  <Link href={item.href} className="flex items-start gap-2.5">
                    <span className="mt-0.5 shrink-0 rounded-full p-1 bg-slate-100">
                      {item.type === "escalation" ? (
                        <MessageSquare className="h-3.5 w-3.5 text-amber-600" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 text-brand-600" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700">{item.label}</p>
                      <p className="text-xs text-slate-400 truncate">{item.detail}</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100 transition-colors focus:outline-none">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-sm font-semibold select-none">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-slate-900 leading-none">
                  {session?.user?.name ?? session?.user?.email}
                </p>
                <p className="text-xs text-slate-500 leading-none mt-0.5">
                  {session?.user?.role}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-slate-900 truncate">
                {session?.user?.name ?? "Usuario"}
              </p>
              <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
