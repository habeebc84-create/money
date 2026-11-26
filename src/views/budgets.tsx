"use client";

import { useState } from "react";
import { useStore } from "@/components/store";
import { useToast } from "@/components/toast";
import { Card, MonthSwitcher, PageHeader, Progress } from "@/components/common";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { budgetLines, budgetStatus, budgetSummary, spentByCategory } from "@/lib/budget";
import { EXPENSE_CATEGORIES, categoryColor } from "@/lib/categories";
import { monthKey, todayISO } from "@/lib/dates";
import { formatINR, paiseToPlain, parseAmount } from "@/lib/money";
import { cn } from "@/lib/utils";

export function BudgetsView() {
  const { data } = useStore();
  const [mk, setMk] = useState(monthKey(todayISO()));
  const spent = spentByCategory(data.entries, mk);
  const summary = budgetSummary(budgetLines(data, mk));

  return (
    <div>
      <PageHeader title="Budgets" lead="Set a monthly limit for the categories you want to watch. You'll get a warning at 80% and when you go over." action={<MonthSwitcher value={mk} onChange={setMk} />} />
      {summary.totalLimit > 0 && (
        <Card className="mb-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm text-muted">Across your budgets</p>
              <p className="figures text-2xl font-semibold">{formatINR(summary.budgetedSpent)} <span className="text-base font-medium text-muted">of {formatINR(summary.totalLimit)}</span></p>
            </div>
            <p className={cn("text-sm font-semibold", summary.overCount ? "text-danger" : summary.warnCount ? "text-warn" : "text-income")}>
              {summary.overCount ? `${summary.overCount} over budget` : summary.warnCount ? `${summary.warnCount} close to the limit` : "All within limits"}
            </p>
          </div>
          <div className="mt-3"><Progress ratio={summary.budgetedSpent / summary.totalLimit} status={budgetStatus(summary.budgetedSpent, summary.totalLimit)} label={`Total: ${formatINR(summary.budgetedSpent)} of ${formatINR(summary.totalLimit)}`} /></div>
        </Card>
      )}
      <ul className="grid gap-3 md:grid-cols-2">
        {EXPENSE_CATEGORIES.map((c) => <BudgetRow key={c + (data.budgets[c] ?? 0)} category={c} limit={data.budgets[c]} spent={spent.get(c) ?? 0} />)}
      </ul>
      <p className="mt-4 text-xs text-muted">Limits repeat every month. Leave a box empty for categories you don&apos;t want to track.</p>
    </div>
  );
}

function BudgetRow({ category, limit, spent }: { category: string; limit?: number; spent: number }) {
  const { setBudget } = useStore();
  const toast = useToast();
  const [value, setValue] = useState(limit ? paiseToPlain(limit) : "");
  const [error, setError] = useState<string | null>(null);
  const id = `b-${category.replace(/\W+/g, "-").toLowerCase()}`;
  const status = limit ? budgetStatus(spent, limit) : "ok";
  const dirty = value !== (limit ? paiseToPlain(limit) : "");

  const save = () => {
    if (value.trim() === "") { setBudget(category, null); setError(null); toast(`${category} budget removed`); return; }
    const r = parseAmount(value);
    if (!r.ok) { setError(r.error); return; }
    setError(null); setBudget(category, r.paise); toast(`${category} budget saved`);
  };

  return (
    <li className="rounded-3xl border border-rule bg-paper p-4 shadow-[var(--shadow)]">
      <div className="flex items-center gap-2.5">
        <span className="size-3 rounded-full" style={{ background: categoryColor(category) }} aria-hidden />
        <h2 className="flex-1 font-sans text-base font-semibold tracking-normal">{category}</h2>
        <span className="figures text-sm text-muted">{formatINR(spent)} spent</span>
      </div>
      {limit ? (
        <div className="mt-3 grid gap-1.5">
          <Progress ratio={spent / limit} status={status} label={`${category}: ${formatINR(spent)} of ${formatINR(limit)}`} />
          <p className={cn("text-sm", status === "over" ? "font-semibold text-danger" : status === "warn" ? "font-semibold text-warn" : "text-muted")}>
            {status === "over" ? `Over by ${formatINR(spent - limit)}` : `${formatINR(limit - spent)} left${status === "warn" ? ". Getting close" : ""}`}
          </p>
        </div>
      ) : null}
      <div className="mt-3 flex items-start gap-2">
        <div className="relative flex-1">
          <label htmlFor={id} className="sr-only">Monthly limit for {category} in rupees</label>
          <span className="figures pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden>₹</span>
          <input id={id} inputMode="decimal" placeholder="No limit" value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()}
            aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={cn(inputClass, "figures h-11 pl-8")} />
        </div>
        <Button variant={dirty ? "primary" : "outline"} size="md" onClick={save} disabled={!dirty}>Save</Button>
      </div>
      {error && <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm font-medium text-danger">{error}</p>}
    </li>
  );
}
