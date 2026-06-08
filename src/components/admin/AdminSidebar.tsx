"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Zap,
  BarChart3,
  Settings,
  MessageSquare,
  LogOut,
  AlertTriangle,
  Layers,
  Shield,
  Code,
  Upload,
  Loader2,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/context/preferences";
import { updateAvatar, removeAvatar } from "@/actions/profile";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdminSidebarProps {
  adminName: string;
  logoUrl?: string | null;
}

export function AdminSidebar({ adminName, logoUrl: initialLogoUrl }: AdminSidebarProps) {
  const pathname = usePathname();
  const { t } = usePreferences();

  const [logoDialogOpen, setLogoDialogOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl ?? "");
  const [currentLogoUrl, setCurrentLogoUrl] = useState(initialLogoUrl);
  const [isPending, startTransition] = useTransition();

  const navItems = [
    { href: "/admin/dashboard", label: t.dashboard, icon: LayoutDashboard },
    { href: "/admin/clients", label: t.adminNavClients, icon: Users },
    { href: "/admin/automations", label: t.automations, icon: Zap },
    { href: "/admin/escalations", label: t.adminNavEscalations, icon: AlertTriangle },
    { href: "/admin/requests", label: t.requests, icon: MessageSquare },
    { href: "/admin/templates", label: t.templates, icon: Layers },
    { href: "/admin/metrics", label: t.adminNavMetrics, icon: BarChart3 },
    { href: "/admin/audit", label: t.adminNavAudit, icon: Shield },
    { href: "/admin/api-docs", label: "API Docs", icon: Code },
    { href: "/admin/settings", label: t.settings, icon: Settings },
  ];

  function handleSaveLogo() {
    startTransition(async () => {
      try {
        if (logoUrl) {
          await updateAvatar(logoUrl);
        }
        setCurrentLogoUrl(logoUrl || null);
        setLogoDialogOpen(false);
        toast.success(t.success);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t.error);
      }
    });
  }

  function handleRemoveLogo() {
    setLogoUrl("");
    startTransition(async () => {
      try {
        await removeAvatar();
        setCurrentLogoUrl(null);
        setLogoDialogOpen(false);
        toast.success(t.success);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t.error);
      }
    });
  }

  return (
    <>
      <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
        {/* Logo — clickable to update */}
        <button
          onClick={() => { setLogoUrl(currentLogoUrl ?? ""); setLogoDialogOpen(true); }}
          className="flex h-16 items-center border-b border-slate-200 px-6 w-full text-left group hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              {currentLogoUrl ? (
                <img src={currentLogoUrl} alt={adminName} className="h-8 w-8 rounded-lg object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
                  <Zap className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="h-3 w-3 text-white" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900 leading-none">{adminName}</p>
              <p className="text-xs text-slate-500 leading-none mt-0.5">Admin</p>
            </div>
          </div>
        </button>

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
            {t.signOut}
          </button>
        </div>
      </aside>

      {/* ── Logo Dialog ──────────────────────────────────────────── */}
      <Dialog open={logoDialogOpen} onOpenChange={(o) => !o && setLogoDialogOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-brand-600" />
              {t.orgLogoTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {logoUrl && (
              <div className="flex justify-center">
                <img src={logoUrl} alt="" className="h-20 w-20 rounded-xl object-cover ring-4 ring-brand-100" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="admin-logo-url">{t.logoUrl}</Label>
              <Input
                id="admin-logo-url"
                type="url"
                placeholder="https://..."
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoDialogOpen(false)}>{t.cancel}</Button>
            {currentLogoUrl && (
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                disabled={isPending}
                onClick={handleRemoveLogo}
              >
                {t.removeLogo}
              </Button>
            )}
            <Button onClick={handleSaveLogo} disabled={isPending || !logoUrl}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
