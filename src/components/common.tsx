"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel, shiftMonth, todayISO, monthKey, type MonthKey } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function PageHeader({ title, lead, action }: { title: string; lead?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-extrabold leading-[1.05]">{title}</h1>
        {lead && <p className="mt-1.5 max-w-prose text-[15px] text-muted">{lead}</p>}
      </div>
      {action}
    </div>
  );
}

export function MonthSwitcher({ value, onChange }: { value: MonthKey; onChange: (m: MonthKey) => void }) {
  const current = monthKey(todayISO());
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-rule bg-paper p-1" role="group" aria-label="Choose month">
      <button onClick={() => onChange(shiftMonth(value, -1))} className="grid size-9 place-items-center rounded-full hover:bg-paper-2" aria-label="Previous month"><ChevronLeft className="size-4" aria-hidden /></button>
      <span className="min-w-[9.5rem] text-center text-sm font-semibold" aria-live="polite">{monthLabel(value)}</span>
      <button onClick={() => onChange(shiftMonth(value, 1))} disabled={value >= current} className="grid size-9 place-items-center rounded-full hover:bg-paper-2 disabled:opacity-30" aria-label="Next month"><ChevronRight className="size-4" aria-hidden /></button>
    </div>
  );
}

export function Card({ className, children, as: As = "section", ...rest }: { className?: string; children: React.ReactNode; as?: "section" | "div" | "article" } & React.HTMLAttributes<HTMLElement>) {
  return <As className={cn("rounded-3xl border border-rule bg-paper p-5 shadow-[var(--shadow)]", className)} {...rest}>{children}</As>;
}

export function EmptyState({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="grid place-items-center rounded-3xl border border-dashed border-rule-strong px-6 py-12 text-center">
      <svg viewBox="0 0 64 64" className="mb-4 size-14" aria-hidden>
        <rect x="10" y="8" width="44" height="50" rx="6" fill="var(--paper-2)" stroke="var(--rule-strong)" strokeWidth="2" />
        <path d="M18 22h28M18 31h20M18 40h24" stroke="var(--rule-strong)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="47" cy="47" r="10" fill="var(--accent)" />
        <path d="M47 42v10M42 47h10" stroke="var(--on-accent)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>
      {children && <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}

export function Progress({ ratio, status, label }: { ratio: number; status: "ok" | "warn" | "over"; label: string }) {
  const pct = Math.min(100, Math.round(ratio * 100));
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-paper-2 shadow-[inset_0_0_0_1px_var(--rule)]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(999, Math.round(ratio * 100))} aria-valuetext={label} aria-label={label}>
      <div className={cn("h-full rounded-full transition-[width] duration-500 ease-out", status === "over" ? "bg-danger" : status === "warn" ? "bg-accent" : "bg-brand")} style={{ width: `${pct}%` }} />
    </div>
  );
}
