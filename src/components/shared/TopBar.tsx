"use client";

import { Bell, User } from "lucide-react";
import { useSession } from "next-auth/react";

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const { data: session } = useSession();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      {title && (
        <p className="text-sm text-slate-500">{title}</p>
      )}
      <div className="ml-auto flex items-center gap-3">
        <button className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-900 leading-none">
              {session?.user?.name ?? session?.user?.email}
            </p>
            <p className="text-xs text-slate-500 leading-none mt-0.5">
              {session?.user?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
