"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search, Plus, X } from "lucide-react";
import { useStore } from "@/components/store";
import { useEntryEditor } from "@/components/entry-editor";
import { EmptyState, PageHeader } from "@/components/common";
import { EntryRow } from "@/components/entry-row";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { ALL_CATEGORIES, PAYMENT_METHODS } from "@/lib/categories";
import { longDate, monthKey, monthLabel } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import type { Entry } from "@/lib/types";
import { cn } from "@/lib/utils";

const selectClass = cn(inputClass, "h-11 text-sm");

export function EntriesView() {
  const { data } = useStore();
  const { openNew } = useEntryEditor();
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | "expense" | "income">("all");
  const [cat, setCat] = useState("all");
  const [method, setMethod] = useState("all");
  const [month, setMonth] = useState("all");
  const dq = useDeferredValue(q);

  const months = useMemo(() => [...new Set(data.entries.map((e) => monthKey(e.date)))].sort().reverse(), [data.entries]);

  const filtered = useMemo(() => {
    const needle = dq.trim().toLowerCase();
    return data.entries
      .filter((e) => (type === "all" || e.type === type)
        && (cat === "all" || e.category === cat)
        && (method === "all" || e.method === method)
        && (month === "all" || monthKey(e.date) === month)
        && (!needle || e.note.toLowerCase().includes(needle) || e.category.toLowerCase().includes(needle) || String(e.amount / 100).includes(needle)))
      .sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1));
  }, [data.entries, dq, type, cat, method, month]);

  const groups = useMemo(() => {
    const m = new Map<string, Entry[]>();
    for (const e of filtered.slice(0, 400)) { const l = m.get(e.date) ?? []; l.push(e); m.set(e.date, l); }
    return [...m.entries()];
  }, [filtered]);

  const totals = filtered.reduce((a, e) => { if (e.type === "income") a.in += e.amount; else a.out += e.amount; return a; }, { in: 0, out: 0 });
  const filtersOn = q || type !== "all" || cat !== "all" || method !== "all" || month !== "all";
  const clear = () => { setQ(""); setType("all"); setCat("all"); setMethod("all"); setMonth("all"); };

  return (
    <div>
      <PageHeader title="Passbook" lead="Every rupee in and out, newest first. Tap a line to edit or delete it." action={<Button onClick={() => openNew()}><Plus aria-hidden />Add</Button>} />

      {data.entries.length === 0 ? (
        <EmptyState title="No entries yet" body="Add your first spend or money in. It'll show up here like a passbook line.">
          <Button onClick={() => openNew()}><Plus aria-hidden />Add first entry</Button>
        </EmptyState>
      ) : (
        <>
          <div className="mb-4 grid gap-2.5 rounded-3xl border border-rule bg-paper p-3 shadow-[var(--shadow)]" role="search">
            <div className="relative">
              <label htmlFor="q" className="sr-only">Search notes, categories or amounts</label>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <input id="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes, categories, amounts" className={cn(inputClass, "pl-10")} />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <label className="sr-only" htmlFor="f-type">Type</label>
              <select id="f-type" value={type} onChange={(e) => setType(e.target.value as typeof type)} className={selectClass}>
                <option value="all">In and out</option><option value="expense">Spent only</option><option value="income">Money in only</option>
              </select>
              <label className="sr-only" htmlFor="f-cat">Category</label>
              <select id="f-cat" value={cat} onChange={(e) => setCat(e.target.value)} className={selectClass}>
                <option value="all">All categories</option>
                {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <label className="sr-only" htmlFor="f-method">Paid with</label>
              <select id="f-method" value={method} onChange={(e) => setMethod(e.target.value)} className={selectClass}>
                <option value="all">Any method</option>
                {PAYMENT_METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
              <label className="sr-only" htmlFor="f-month">Month</label>
              <select id="f-month" value={month} onChange={(e) => setMonth(e.target.value)} className={selectClass}>
                <option value="all">All months</option>
                {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
              </select>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1 text-sm" aria-live="polite">
            <p className="text-muted">
              <span className="font-semibold text-ink">{filtered.length}</span> {filtered.length === 1 ? "entry" : "entries"}
              {" · "}out <span className="figures font-semibold text-ink">{formatINR(totals.out)}</span>
              {" · "}in <span className="figures font-semibold text-income">{formatINR(totals.in)}</span>
            </p>
            {filtersOn && <button onClick={clear} className="inline-flex h-9 items-center gap-1 rounded-full px-3 font-semibold text-accent-ink hover:bg-paper-2"><X className="size-3.5" aria-hidden />Clear filters</button>}
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="Nothing matches" body="Try a different word or clear the filters."><Button variant="outline" onClick={clear}>Clear filters</Button></EmptyState>
          ) : (
            <div className="grid gap-4">
              {groups.map(([date, list]) => (
                <section key={date} aria-label={longDate(date)} className="rounded-3xl border border-rule bg-paper px-3 pb-2 pt-3 shadow-[var(--shadow)]">
                  <h2 className="flex items-center justify-between gap-2 border-b border-dashed border-rule px-2 pb-2 font-sans text-sm font-semibold tracking-normal text-ink-2">
                    <span>{longDate(date)}</span>
                    <span className="figures text-xs font-medium text-muted">{formatINR(list.filter((e) => e.type === "expense").reduce((a, e) => a + e.amount, 0))} out</span>
                  </h2>
                  <ul className="grid">{list.map((e) => <EntryRow key={e.id} e={e} />)}</ul>
                </section>
              ))}
              {filtered.length > 400 && <p className="text-center text-sm text-muted">Showing the newest 400. Use filters to narrow down.</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
