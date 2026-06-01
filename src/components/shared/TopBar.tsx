"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, LogOut, MessageSquare, FileText } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

interface NotificationItem {
  type: string;
  label: string;
  detail: string;
  href: string;
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
  const [notifications, setNotifications] = useState<{ count: number; items: NotificationItem[] }>({
    count: 0,
    items: [],
  });
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifPos, setNotifPos] = useState<{ top: number; right: number } | null>(null);
  const [userMenuPos, setUserMenuPos] = useState<{ top: number; right: number } | null>(null);

  const notifBtnRef = useRef<HTMLButtonElement>(null);
  const notifDropRef = useRef<HTMLDivElement>(null);
  const userBtnRef = useRef<HTMLButtonElement>(null);
  const userDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setNotifications(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      const t = e.target as Node;
      if (!notifBtnRef.current?.contains(t) && !notifDropRef.current?.contains(t)) {
        setNotifOpen(false);
      }
      if (!userBtnRef.current?.contains(t) && !userDropRef.current?.contains(t)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggleNotif() {
    if (notifOpen) {
      setNotifOpen(false);
      return;
    }
    if (notifBtnRef.current) {
      const r = notifBtnRef.current.getBoundingClientRect();
      setNotifPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }
    setNotifOpen(true);
    setUserMenuOpen(false);
  }

  function toggleUserMenu() {
    if (userMenuOpen) {
      setUserMenuOpen(false);
      return;
    }
    if (userBtnRef.current) {
      const r = userBtnRef.current.getBoundingClientRect();
      setUserMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }
    setUserMenuOpen(true);
    setNotifOpen(false);
  }

  const initials = getInitials(session?.user?.name, session?.user?.email);

  return (
    <header className="relative flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      {title && <p className="text-sm text-slate-500">{title}</p>}

      <div className="ml-auto flex items-center gap-2">
        {/* ── Notification bell ─────────────────────────────── */}
        <button
          ref={notifBtnRef}
          onClick={toggleNotif}
          className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none"
        >
          <Bell className="h-4 w-4" />
          {notifications.count > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {notifications.count > 9 ? "9+" : notifications.count}
            </span>
          )}
        </button>

        {notifOpen && notifPos && (
          <div
            ref={notifDropRef}
            style={{ position: "fixed", top: notifPos.top, right: notifPos.right, zIndex: 9999 }}
            className="w-72 rounded-lg border border-slate-200 bg-white shadow-lg"
          >
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="text-xs font-semibold text-slate-700">Notificaciones</p>
            </div>
            {notifications.items.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-slate-400">Sin notificaciones</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.items.map((item, i) => (
                  <Link
                    key={i}
                    href={item.href}
                    onClick={() => setNotifOpen(false)}
                    className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-slate-50 transition-colors"
                  >
                    <span className="mt-0.5 shrink-0 rounded-full bg-slate-100 p-1">
                      {item.type === "escalation" ? (
                        <MessageSquare className="h-3.5 w-3.5 text-amber-600" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 text-brand-600" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700">{item.label}</p>
                      <p className="truncate text-xs text-slate-400">{item.detail}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── User menu ──────────────────────────────────────── */}
        <button
          ref={userBtnRef}
          onClick={toggleUserMenu}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100 transition-colors focus:outline-none"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 select-none">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium leading-none text-slate-900">
              {session?.user?.name ?? session?.user?.email}
            </p>
            <p className="mt-0.5 text-xs leading-none text-slate-500">{session?.user?.role}</p>
          </div>
        </button>

        {userMenuOpen && userMenuPos && (
          <div
            ref={userDropRef}
            style={{ position: "fixed", top: userMenuPos.top, right: userMenuPos.right, zIndex: 9999 }}
            className="w-56 rounded-lg border border-slate-200 bg-white shadow-lg"
          >
            <div className="border-b border-slate-100 px-3 py-2.5">
              <p className="truncate text-sm font-medium text-slate-900">
                {session?.user?.name ?? "Usuario"}
              </p>
              <p className="truncate text-xs text-slate-500">{session?.user?.email}</p>
            </div>
            <div className="py-1">
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  signOut({ callbackUrl: "/login" });
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
