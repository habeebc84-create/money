import * as React from "react";
import { cn } from "@/lib/utils";

export const inputClass =
  "h-12 w-full rounded-xl border border-rule-strong bg-paper-2 px-3.5 text-base text-ink placeholder:text-muted/80 transition-colors hover:border-ink-2 focus-visible:border-brand aria-[invalid=true]:border-danger";

export function Field({
  label, htmlFor, error, hint, children, className,
}: { label: string; htmlFor: string; error?: string | null; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink-2">{label}</label>
      {children}
      {hint && !error && <p id={`${htmlFor}-hint`} className="text-xs text-muted">{hint}</p>}
      {error && <p id={`${htmlFor}-error`} role="alert" className="text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}

export function describedBy(id: string, error?: string | null, hint?: string) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

/** Segmented single-choice control built on native radios (keyboard + screen reader friendly). */
export function Segmented<T extends string>({
  name, legend, value, options, onChange, className,
}: { name: string; legend: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; className?: string }) {
  return (
    <fieldset className={cn("grid gap-1.5", className)}>
      <legend className="mb-1.5 text-sm font-semibold text-ink-2">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <label key={o.value} className="relative">
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="peer sr-only" />
            <span className="inline-flex h-10 cursor-pointer items-center rounded-full border border-rule-strong px-3.5 text-sm font-medium text-ink-2 transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline peer-focus-visible:outline-[2.5px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)] hover:border-ink">
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
