"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import {
  Bell, LogOut, MessageSquare, FileText, Sun, Moon, Globe,
  Image as ImageIcon, KeyRound, RefreshCw, User, Loader2,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePreferences, type Theme, type Lang } from "@/context/preferences";
import { updateAvatar, changePassword, removeAvatar } from "@/actions/profile";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

type ActiveDialog = null | "avatar" | "password" | "switch-account";

export function TopBar({ title }: TopBarProps) {
  const { data: session } = useSession();
  const { theme, setTheme, lang, setLang, t } = usePreferences();

  const [notifications, setNotifications] = useState<{ count: number; items: NotificationItem[] }>({
    count: 0,
    items: [],
  });
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifPos, setNotifPos] = useState<{ top: number; right: number } | null>(null);
  const [userMenuPos, setUserMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);

  // Avatar dialog state
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userImage, setUserImage] = useState<string | null>(session?.user?.image ?? null);
  const [isPendingAvatar, startAvatarTransition] = useTransition();

  // Password dialog state
  const [pwdForm, setPwdForm] = useState({ current: "", next: "", confirm: "" });
  const [isPendingPwd, startPwdTransition] = useTransition();

  const notifBtnRef = useRef<HTMLButtonElement>(null);
  const notifDropRef = useRef<HTMLDivElement>(null);
  const userBtnRef = useRef<HTMLButtonElement>(null);
  const userDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.user?.image) setUserImage(session.user.image);
  }, [session?.user?.image]);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setNotifications(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (!notifBtnRef.current?.contains(target) && !notifDropRef.current?.contains(target)) {
        setNotifOpen(false);
      }
      if (!userBtnRef.current?.contains(target) && !userDropRef.current?.contains(target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggleNotif() {
    if (notifOpen) { setNotifOpen(false); return; }
    if (notifBtnRef.current) {
      const r = notifBtnRef.current.getBoundingClientRect();
      setNotifPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }
    setNotifOpen(true);
    setUserMenuOpen(false);
  }

  function toggleUserMenu() {
    if (userMenuOpen) { setUserMenuOpen(false); return; }
    if (userBtnRef.current) {
      const r = userBtnRef.current.getBoundingClientRect();
      setUserMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }
    setUserMenuOpen(true);
    setNotifOpen(false);
  }

  function openDialog(dialog: ActiveDialog) {
    setUserMenuOpen(false);
    setActiveDialog(dialog);
    if (dialog === "avatar") {
      setAvatarUrl(userImage ?? "");
    }
    if (dialog === "password") {
      setPwdForm({ current: "", next: "", confirm: "" });
    }
  }

  function handleSaveAvatar() {
    if (!avatarUrl) {
      startAvatarTransition(async () => {
        try {
          await removeAvatar();
          setUserImage(null);
          setActiveDialog(null);
          toast.success(lang === "es" ? "Avatar eliminado" : "Avatar removed");
        } catch (e) {
          toast.error(e instanceof Error ? e.message : t.error);
        }
      });
      return;
    }
    startAvatarTransition(async () => {
      try {
        await updateAvatar(avatarUrl);
        setUserImage(avatarUrl);
        setActiveDialog(null);
        toast.success(lang === "es" ? "Avatar actualizado" : "Avatar updated");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t.error);
      }
    });
  }

  function handleChangePassword() {
    if (pwdForm.next !== pwdForm.confirm) {
      toast.error(lang === "es" ? "Las contraseñas no coinciden" : "Passwords don't match");
      return;
    }
    if (pwdForm.next.length < 8) {
      toast.error(lang === "es" ? "Mínimo 8 caracteres" : "Minimum 8 characters");
      return;
    }
    startPwdTransition(async () => {
      try {
        await changePassword({ currentPassword: pwdForm.current, newPassword: pwdForm.next });
        setActiveDialog(null);
        setPwdForm({ current: "", next: "", confirm: "" });
        toast.success(lang === "es" ? "Contraseña actualizada" : "Password updated");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t.error);
      }
    });
  }

  const initials = getInitials(session?.user?.name, session?.user?.email);
  const userRole = session?.user?.role ?? "";

  return (
    <>
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
                <p className="text-xs font-semibold text-slate-700">{t.notifications}</p>
              </div>
              {notifications.items.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-slate-400">{t.noNotifications}</p>
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

          {/* ── User menu trigger ──────────────────────────────── */}
          <button
            ref={userBtnRef}
            onClick={toggleUserMenu}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100 transition-colors focus:outline-none"
          >
            {userImage ? (
              <img
                src={userImage}
                alt=""
                className="h-8 w-8 rounded-full object-cover ring-2 ring-brand-100"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 select-none">
                {initials}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium leading-none text-slate-900">
                {session?.user?.name ?? session?.user?.email}
              </p>
              <p className="mt-0.5 text-xs leading-none text-slate-500">{userRole}</p>
            </div>
          </button>

          {/* ── User dropdown ──────────────────────────────────── */}
          {userMenuOpen && userMenuPos && (
            <div
              ref={userDropRef}
              style={{ position: "fixed", top: userMenuPos.top, right: userMenuPos.right, zIndex: 9999 }}
              className="w-72 rounded-lg border border-slate-200 bg-white shadow-xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center gap-3 bg-gradient-to-r from-brand-50 to-slate-50 px-4 py-3 border-b border-slate-100">
                {userImage ? (
                  <img src={userImage} alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow" />
                ) : (
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-base font-bold text-white shadow">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{session?.user?.name ?? "—"}</p>
                  <p className="truncate text-xs text-slate-500">{session?.user?.email}</p>
                  <span className="mt-0.5 inline-block rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 uppercase tracking-wide">
                    {userRole}
                  </span>
                </div>
              </div>

              {/* Profile actions */}
              <div className="py-1 border-b border-slate-100">
                <button
                  onClick={() => openDialog("avatar")}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <ImageIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  {t.changeAvatar}
                </button>
                <button
                  onClick={() => openDialog("password")}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <KeyRound className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  {t.changePassword}
                </button>
              </div>

              {/* Preferences */}
              <div className="px-4 py-3 border-b border-slate-100 space-y-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{t.preferences}</p>

                {/* Theme */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-slate-700">
                    {theme === "dark" ? <Moon className="h-3.5 w-3.5 text-slate-400" /> : <Sun className="h-3.5 w-3.5 text-slate-400" />}
                    {t.theme}
                  </span>
                  <div className="flex rounded-md border border-slate-200 overflow-hidden">
                    <button
                      onClick={() => setTheme("light" as Theme)}
                      className={cn(
                        "px-2.5 py-1 text-xs font-medium transition-colors",
                        theme === "light" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {t.light}
                    </button>
                    <button
                      onClick={() => setTheme("dark" as Theme)}
                      className={cn(
                        "px-2.5 py-1 text-xs font-medium transition-colors border-l border-slate-200",
                        theme === "dark" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {t.dark}
                    </button>
                  </div>
                </div>

                {/* Language */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-slate-700">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                    {t.language}
                  </span>
                  <div className="flex rounded-md border border-slate-200 overflow-hidden">
                    <button
                      onClick={() => setLang("es" as Lang)}
                      className={cn(
                        "px-2.5 py-1 text-xs font-medium transition-colors",
                        lang === "es" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      ES
                    </button>
                    <button
                      onClick={() => setLang("en" as Lang)}
                      className={cn(
                        "px-2.5 py-1 text-xs font-medium transition-colors border-l border-slate-200",
                        lang === "en" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      EN
                    </button>
                  </div>
                </div>
              </div>

              {/* Switch account */}
              <div className="py-1 border-b border-slate-100">
                <button
                  onClick={() => openDialog("switch-account")}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  {t.switchAccount}
                </button>
              </div>

              {/* Sign out */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    signOut({ callbackUrl: "/login" });
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4 flex-shrink-0" />
                  {t.signOut}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Avatar Dialog ──────────────────────────────────────────── */}
      <Dialog open={activeDialog === "avatar"} onOpenChange={(o) => !o && setActiveDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-brand-600" />
              {t.changeAvatarTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {avatarUrl && (
              <div className="flex justify-center">
                <img src={avatarUrl} alt="" className="h-20 w-20 rounded-full object-cover ring-4 ring-brand-100" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="avatar-url">{t.imageUrl}</Label>
              <Input
                id="avatar-url"
                type="url"
                placeholder="https://..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveDialog(null)}>{t.cancel}</Button>
            {userImage && (
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleSaveAvatar}
                disabled={isPendingAvatar}
              >
                {isPendingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : t.removeLogo}
              </Button>
            )}
            <Button onClick={handleSaveAvatar} disabled={isPendingAvatar || !avatarUrl}>
              {isPendingAvatar ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Password Dialog ─────────────────────────────────────────── */}
      <Dialog open={activeDialog === "password"} onOpenChange={(o) => !o && setActiveDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-brand-600" />
              {t.changePasswordTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="pwd-current">{t.currentPassword}</Label>
              <Input
                id="pwd-current"
                type="password"
                value={pwdForm.current}
                onChange={(e) => setPwdForm((p) => ({ ...p, current: e.target.value }))}
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pwd-new">{t.newPassword}</Label>
              <Input
                id="pwd-new"
                type="password"
                value={pwdForm.next}
                onChange={(e) => setPwdForm((p) => ({ ...p, next: e.target.value }))}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pwd-confirm">{t.confirmPassword}</Label>
              <Input
                id="pwd-confirm"
                type="password"
                value={pwdForm.confirm}
                onChange={(e) => setPwdForm((p) => ({ ...p, confirm: e.target.value }))}
                autoComplete="new-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveDialog(null)}>{t.cancel}</Button>
            <Button
              onClick={handleChangePassword}
              disabled={isPendingPwd || !pwdForm.current || !pwdForm.next || !pwdForm.confirm}
            >
              {isPendingPwd ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Switch Account Dialog ───────────────────────────────────── */}
      <Dialog open={activeDialog === "switch-account"} onOpenChange={(o) => !o && setActiveDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-brand-600" />
              {t.switchAccount}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.currentAccount}</p>
            <div className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 p-3">
              {userImage ? (
                <img src={userImage} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {initials}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-900">{session?.user?.name}</p>
                <p className="text-xs text-slate-500">{session?.user?.email}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">{t.switchAccountInfo}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveDialog(null)}>{t.close}</Button>
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => { setActiveDialog(null); signOut({ callbackUrl: "/login" }); }}
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              {t.signOut}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
