"use client";

import { formatINR } from "@/lib/money";

export interface Slice { label: string; value: number; color: string }

/** Category donut. Decorative SVG is aria-hidden; the legend beside it is the accessible version. */
export function Donut({ slices, total, centerLabel }: { slices: Slice[]; total: number; centerLabel: string }) {
  const r = 52, c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[220px]">
      <svg viewBox="0 0 140 140" className="size-full -rotate-90" aria-hidden>
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--rule)" strokeWidth="16" />
        {total > 0 && slices.map((s) => {
          const len = (s.value / total) * c;
          const el = (
            <circle key={s.label} cx="70" cy="70" r={r} fill="none" stroke={s.color} strokeWidth="16"
              strokeDasharray={`${Math.max(len - 1.5, 0.5)} ${c}`} strokeDashoffset={-offset} />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <span className="text-xs font-medium text-muted">{centerLabel}</span>
        <span className="figures text-xl font-semibold">{formatINR(total)}</span>
      </div>
    </div>
  );
}

/** Bar trend with an accessible data table fallback. */
export function Bars({
  values, labels, caption, highlightIndex, guide, guideLabel,
}: { values: number[]; labels: string[]; caption: string; highlightIndex?: number; guide?: number; guideLabel?: string }) {
  const max = Math.max(1, guide ?? 0, ...values);
  const h = 120;
  const w = Math.max(values.length * 10, 120);
  const bw = w / values.length;
  const sparse = values.length > 12;
  return (
    <figure className="grid gap-2">
      <svg viewBox={`0 0 ${w} ${h + 18}`} className="h-44 w-full" preserveAspectRatio="none" aria-hidden>
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="0" x2={w} y1={h - h * f} y2={h - h * f} stroke="var(--rule)" strokeWidth="0.6" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />)}
        {values.map((v, i) => {
          const bh = v === 0 ? 0 : Math.max(2, (v / max) * h);
          return (
            <rect key={i} x={i * bw + bw * 0.18} y={h - bh} width={bw * 0.64} height={bh} rx={Math.min(3, bw * 0.2)}
              fill={i === highlightIndex ? "var(--accent)" : "var(--brand)"} opacity={i === highlightIndex ? 1 : 0.78} />
          );
        })}
        {guide ? <line x1="0" x2={w} y1={h - (guide / max) * h} y2={h - (guide / max) * h} stroke="var(--danger)" strokeWidth="1.2" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" /> : null}
        <line x1="0" x2={w} y1={h} y2={h} stroke="var(--rule-strong)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="grid text-center text-[11px] text-muted" style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }} aria-hidden>
        {labels.map((l, i) => <span key={i} className="overflow-visible whitespace-nowrap">{!sparse || i === 0 || (i + 1) % 7 === 0 ? l : ""}</span>)}
      </div>
      <figcaption className="text-xs text-muted">{caption}{guide && guideLabel ? `. Dashed line: ${guideLabel}.` : ""}</figcaption>
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead><tr><th scope="col">Period</th><th scope="col">Spent</th></tr></thead>
        <tbody>{values.map((v, i) => <tr key={i}><td>{labels[i]}</td><td>{formatINR(v)}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
