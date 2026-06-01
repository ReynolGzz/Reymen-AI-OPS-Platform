"use client";

import { cn } from "@/lib/utils";
import { usePreferences } from "@/context/preferences";

interface LeadScoreBadgeProps {
  score: number | null;
  reason?: string | null;
  showTooltip?: boolean;
  size?: "sm" | "md";
}

function scoreColor(score: number): string {
  if (score >= 75) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (score >= 50) return "bg-blue-100 text-blue-700 border-blue-200";
  if (score >= 25) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-700 border-red-200";
}

export function LeadScoreBadge({ score, reason, showTooltip = false, size = "sm" }: LeadScoreBadgeProps) {
  const { t } = usePreferences();

  function scoreLabel(s: number): string {
    if (s >= 75) return t.scoreHigh;
    if (s >= 50) return t.scoreMid;
    if (s >= 25) return t.scoreLow;
    return t.scoreCold;
  }

  if (score === null || score === undefined) {
    return (
      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-400">
        {t.noScore}
      </span>
    );
  }

  return (
    <span
      title={showTooltip && reason ? reason : undefined}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium",
        size === "sm" ? "text-xs" : "text-sm",
        scoreColor(score)
      )}
    >
      <span className={cn("inline-block rounded-full", size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2", scoreColor(score).includes("emerald") ? "bg-emerald-500" : scoreColor(score).includes("blue") ? "bg-blue-500" : scoreColor(score).includes("amber") ? "bg-amber-500" : "bg-red-500")} />
      {score} · {scoreLabel(score)}
    </span>
  );
}
