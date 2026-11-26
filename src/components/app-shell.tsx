"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MotionConfig } from "motion/react";
import { Home, ListOrdered, PiggyBank, Repeat, Target, Settings, Plus, Moon, Sun, X } from "lucide-react";
import { StoreProvider, useStore } from "./store";
import { ToastProvider } from "./toast";
import { EntryEditorProvider, useEntryEditor } from "./entry-editor";
import { useTheme } from "./theme";
import { PwaRegister } from "./pwa";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/entries/", label: "Entries", icon: ListOrdered },
  { href: "/budgets/", label: "Budgets", icon: PiggyBank },
  { href: "/recurring/", label: "Recurring", icon: Repeat },
  { href: "/goals/", label: "Goals", icon: Target },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <StoreProvider>
        <ToastProvider>
          <EntryEditorProvider>
            <Frame>{children}</Frame>
            <PwaRegister />
          </EntryEditorProvider>
        </ToastProvider>
      </StoreProvider>
    </MotionConfig>
  );
}

function isActive(path: string, href: string) {
  const p = path.endsWith("/") ? path : path + "/";
  return href === "/" ? p === "/" : p.startsWith(href);
}

function Frame({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "/";
  const { status, notice, dismissNotice, saveError } = useStore();
  const { openNew } = useEntryEditor();
  const { dark: darkNow, setPref } = useTheme();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-ink focus:px-3 focus:py-2 focus:text-paper">Skip to content</a>

      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 border-r border-rule px-4 py-6 lg:flex">
        <Brand />
        <nav aria-label="Main" className="mt-8 grid gap-1">
          {NAV.map((n) => <NavLink key={n.href} {...n} active={isActive(path, n.href)} rail />)}
          <NavLink href="/settings/" label="Settings" icon={Settings} active={isActive(path, "/settings/")} rail />
        </nav>
        <button onClick={() => openNew()} className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-on-brand hover:brightness-110">
          <Plus className="size-5" aria-hidden /> Add entry <kbd className="ml-1 rounded border border-on-brand/30 px-1.5 text-xs font-medium opacity-80">N</kbd>
        </button>
        <p className="mt-auto text-xs leading-relaxed text-muted">Your data stays on this device. No account, no server.</p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-rule bg-bg/90 px-4 py-3 backdrop-blur lg:hidden">
          <Brand />
          <div className="flex items-center gap-1">
            <button onClick={() => setPref(darkNow ? "light" : "dark")} className="grid size-11 place-items-center rounded-full text-ink-2 hover:bg-paper-2" aria-label={darkNow ? "Switch to light theme" : "Switch to dark theme"}>
              {darkNow ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
            </button>
            <Link href="/settings/" className={cn("grid size-11 place-items-center rounded-full text-ink-2 hover:bg-paper-2", isActive(path, "/settings/") && "bg-paper-2 text-ink")} aria-label="Settings" aria-current={isActive(path, "/settings/") ? "page" : undefined}>
              <Settings className="size-5" aria-hidden />
            </Link>
          </div>
        </header>

        {(notice || saveError) && (
          <div className="px-4 pt-3 lg:px-8 lg:pt-6">
            {saveError && <p role="alert" className="mb-2 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{saveError}</p>}
            {notice && (
              <div role="status" className="flex items-start gap-3 rounded-xl bg-warn-soft px-4 py-3 text-sm text-ink">
                <p className="flex-1">{notice}</p>
                <button onClick={dismissNotice} className="-m-2 grid size-9 place-items-center rounded-full hover:bg-paper" aria-label="Dismiss message"><X className="size-4" aria-hidden /></button>
              </div>
            )}
          </div>
        )}

        <main id="main" className="flex-1 px-4 pb-32 pt-4 lg:px-8 lg:pb-12 lg:pt-6" aria-busy={status === "loading"}>
          {status === "loading" ? <LoadingSkeleton /> : children}
        </main>
      </div>

      {/* Phone: floating add + bottom nav */}
      <button onClick={() => openNew()} className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-30 grid size-14 place-items-center rounded-2xl bg-accent text-on-accent shadow-[0_14px_30px_-12px_rgb(0_0_0/0.45)] active:scale-95 lg:hidden" aria-label="Add entry">
        <Plus className="size-7" aria-hidden />
      </button>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map((n) => <li key={n.href}><NavLink {...n} active={isActive(path, n.href)} /></li>)}
        </ul>
      </nav>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5 rounded-lg" aria-label="Kaasu home">
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <rect width="32" height="32" rx="9" fill="var(--brand)" />
        <circle cx="16" cy="16" r="8.5" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
        <rect x="13.5" y="13.5" width="5" height="5" rx="1" fill="var(--accent)" />
      </svg>
      <span className="font-display text-xl font-extrabold tracking-tight">Kaasu</span>
    </Link>
  );
}

function NavLink({ href, label, icon: Icon, active, rail }: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; active: boolean; rail?: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        rail
          ? "flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-ink-2 hover:bg-paper-2"
          : "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-muted",
        active && (rail ? "bg-paper-2 text-ink shadow-[inset_0_0_0_1px_var(--rule)]" : "text-ink"),
      )}
    >
      <span className={cn(!rail && "grid h-7 w-12 place-items-center rounded-full transition-colors", !rail && active && "bg-accent/35")}>
        <Icon className="size-5" />
      </span>
      {label}
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4" aria-label="Loading your money data">
      <div className="h-44 animate-pulse rounded-3xl bg-paper-2" />
      <div className="grid grid-cols-2 gap-3"><div className="h-24 animate-pulse rounded-2xl bg-paper-2" /><div className="h-24 animate-pulse rounded-2xl bg-paper-2" /></div>
      <div className="h-64 animate-pulse rounded-3xl bg-paper-2" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
