"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { AlertTriangle, ArrowRight, Plus, Sparkles } from "lucide-react";
import { useStore } from "@/components/store";
import { useEntryEditor } from "@/components/entry-editor";
import { Card, EmptyState, MonthSwitcher, Progress } from "@/components/common";
import { Bars, Donut } from "@/components/charts";
import { EntryRow } from "@/components/entry-row";
import { Button } from "@/components/ui/button";
import { budgetLines, budgetSummary, dailySpend, monthTotals, perDayAllowance, spentByCategory } from "@/lib/budget";
import { daysInMonth, monthKey, monthLabel, shiftMonth, todayISO, parts } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import { EXPENSE_CATEGORIES, categoryColor } from "@/lib/categories";
import { monthlyEquivalent } from "@/lib/recurring";
import { cn } from "@/lib/utils";

export function Dashboard() {
  const { data, loadSample } = useStore();
  const { openNew } = useEntryEditor();
  const today = todayISO();
  const [mk, setMk] = useState(monthKey(today));
  const [trend, setTrend] = useState<"daily" | "monthly">("daily");

  const t = useMemo(() => monthTotals(data.entries, mk), [data.entries, mk]);
  const lines = useMemo(() => budgetLines(data, mk), [data, mk]);
  const summary = budgetSummary(lines);
  const cats = useMemo(() => [...spentByCategory(data.entries, mk).entries()].sort((a, b) => b[1] - a[1]), [data.entries, mk]);
  const [y, m] = mk.split("-").map(Number);
  const dim = daysInMonth(y, m);
  const isCurrent = mk === monthKey(today);
  const daysLeft = isCurrent ? dim - parts(today)[2] + 1 : 0;
  const daily = useMemo(() => dailySpend(data.entries, mk, dim), [data.entries, mk, dim]);
  const months = useMemo(() => Array.from({ length: 6 }, (_, i) => shiftMonth(mk, i - 5)), [mk]);
  const monthly = useMemo(() => months.map((k) => monthTotals(data.entries, k).spent), [months, data.entries]);
  const recent = useMemo(() => [...data.entries].filter((e) => monthKey(e.date) === mk).sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1)).slice(0, 6), [data.entries, mk]);
  const committed = data.recurring.filter((r) => r.active && r.type === "expense").reduce((a, r) => a + monthlyEquivalent(r), 0);

  const hasAny = data.entries.length > 0;
  // "Left" = money in minus money out. If nothing came in yet but budgets exist, fall back to budget left.
  const useBudgetForLeft = t.income === 0 && summary.totalLimit > 0;
  const left = useBudgetForLeft ? summary.left : t.net;
  const perDay = perDayAllowance(left, daysLeft);
  const alerts = lines.filter((l) => l.status !== "ok");

  if (!hasAny) {
    return (
      <div className="grid gap-6">
        <Intro />
        <EmptyState title="Your passbook is empty" body="Add what you spend and what comes in. Everything stays on this phone. No sign-up, no server.">
          <Button onClick={() => openNew()}><Plus aria-hidden />Add first entry</Button>
          <Button variant="outline" onClick={() => openNew("income")}>Add money in</Button>
          <Button variant="ghost" onClick={loadSample}><Sparkles aria-hidden />Load sample data</Button>
        </EmptyState>
        <p className="text-center text-xs text-muted">Sample data is clearly marked and can be removed in Settings.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[clamp(1.6rem,5vw,2.25rem)] font-extrabold leading-none">{isCurrent ? "This month" : monthLabel(mk)}</h1>
        <MonthSwitcher value={mk} onChange={setMk} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        {/* The slip: the one authored moment. Prints in from the top once. */}
        <motion.section
          aria-labelledby="slip-title"
          initial={{ clipPath: "inset(0 0 100% 0)", y: -6 }}
          animate={{ clipPath: "inset(0 0 0% 0)", y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="perforated relative rounded-t-3xl bg-slip border border-rule px-6 pt-6 text-slip-ink"
        >
          <h2 id="slip-title" className="text-sm font-medium text-slip-ink/70">{useBudgetForLeft ? "Budget left" : "Left this month"}</h2>
          <p className={cn("figures mt-1 text-[clamp(2.4rem,11vw,3.6rem)] font-semibold leading-none", left < 0 && "text-[#ffb4a8]")}>
            {left < 0 ? "−" : ""}{formatINR(Math.abs(left))}
          </p>
          <p className="mt-2 text-sm text-slip-ink/75">
            {left < 0
              ? "You've spent more than came in. Check the categories below."
              : isCurrent && daysLeft > 0
                ? <>About <span className="figures font-semibold text-[#f2b54a]">{formatINR(perDay)}</span> a day for the next {daysLeft} {daysLeft === 1 ? "day" : "days"}.</>
                : "Month closed."}
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-dashed border-slip-ink/25 pt-4 pb-2">
            <div><dt className="text-xs text-slip-ink/65">Spent</dt><dd className="figures text-lg font-semibold">{formatINR(t.spent)}</dd></div>
            <div><dt className="text-xs text-slip-ink/65">Money in</dt><dd className="figures text-lg font-semibold text-[#f2b54a]">{formatINR(t.income)}</dd></div>
            {summary.totalLimit > 0 && <div><dt className="text-xs text-slip-ink/65">Budgets total</dt><dd className="figures text-base">{formatINR(summary.totalLimit)}</dd></div>}
            {committed > 0 && <div><dt className="text-xs text-slip-ink/65">Fixed each month</dt><dd className="figures text-base">{formatINR(committed)}</dd></div>}
          </dl>
        </motion.section>

        <Card aria-labelledby="where-title">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="where-title" className="text-lg font-bold">Where it went</h2>
            <Link href="/entries/" className="text-sm font-semibold text-accent-ink underline-offset-4 hover:underline">All entries</Link>
          </div>
          {cats.length === 0 ? (
            <p className="mt-6 text-sm text-muted">No spending in {monthLabel(mk)} yet.</p>
          ) : (
            <div className="mt-4 grid items-center gap-5 sm:grid-cols-[180px_1fr] lg:grid-cols-1 xl:grid-cols-[180px_1fr]">
              <Donut total={t.spent} centerLabel="spent" slices={cats.map(([c, v]) => ({ label: c, value: v, color: categoryColor(c, EXPENSE_CATEGORIES) }))} />
              <ul className="grid gap-2" aria-label="Spending by category">
                {cats.slice(0, 6).map(([c, v]) => (
                  <li key={c} className="flex items-center gap-2 text-sm">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: categoryColor(c, EXPENSE_CATEGORIES) }} aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{c}</span>
                    <span className="figures font-medium">{formatINR(v)}</span>
                    <span className="figures w-10 text-right text-xs text-muted">{Math.round((v / t.spent) * 100)}%</span>
                  </li>
                ))}
                {cats.length > 6 && <li className="text-xs text-muted">and {cats.length - 6} more</li>}
              </ul>
            </div>
          )}
        </Card>
      </div>

      {alerts.length > 0 && (
        <Card className="border-accent/60 bg-warn-soft" aria-labelledby="alerts-title">
          <h2 id="alerts-title" className="flex items-center gap-2 text-base font-bold"><AlertTriangle className="size-4 text-warn" aria-hidden />Budget alerts</h2>
          <ul className="mt-3 grid gap-3">
            {alerts.map((l) => (
              <li key={l.category} className="grid gap-1.5">
                <div className="flex justify-between gap-2 text-sm">
                  <span className="font-semibold">{l.category}</span>
                  <span className={cn("figures", l.status === "over" ? "text-danger font-semibold" : "text-warn")}>
                    {l.status === "over" ? `${formatINR(-l.left)} over` : `${formatINR(l.left)} left`}
                  </span>
                </div>
                <Progress ratio={l.ratio} status={l.status} label={`${l.category}: ${formatINR(l.spent)} of ${formatINR(l.limit)}`} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card aria-labelledby="trend-title">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 id="trend-title" className="text-lg font-bold">Spending trend</h2>
            <div className="inline-flex rounded-full border border-rule p-0.5 text-sm" role="group" aria-label="Trend period">
              {(["daily", "monthly"] as const).map((k) => (
                <button key={k} onClick={() => setTrend(k)} aria-pressed={trend === k} className={cn("h-9 rounded-full px-3 font-medium capitalize", trend === k ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2")}>{k}</button>
              ))}
            </div>
          </div>
          {trend === "daily" ? (
            <Bars values={daily} labels={daily.map((_, i) => String(i + 1))} highlightIndex={isCurrent ? parts(today)[2] - 1 : undefined} caption={`Spent per day in ${monthLabel(mk)}`} />
          ) : (
            <Bars values={monthly} labels={months.map((k) => monthLabel(k).slice(0, 3))} highlightIndex={5} guide={summary.totalLimit || undefined} guideLabel="total of your budgets" caption="Spent per month, last 6 months" />
          )}
        </Card>

        <Card aria-labelledby="recent-title">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="recent-title" className="text-lg font-bold">Latest</h2>
            <Link href="/entries/" className="inline-flex items-center gap-1 text-sm font-semibold text-accent-ink underline-offset-4 hover:underline">See all<ArrowRight className="size-3.5" aria-hidden /></Link>
          </div>
          {recent.length === 0 ? <p className="mt-6 text-sm text-muted">Nothing in {monthLabel(mk)}.</p> : (
            <ul className="mt-2 -mx-2 grid">{recent.map((e) => <EntryRow key={e.id} e={e} />)}</ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Intro() {
  return (
    <div className="max-w-xl">
      <h1 className="text-[clamp(2rem,7vw,3rem)] font-extrabold leading-[1.02]">Know where every rupee goes.</h1>
      <p className="mt-3 text-[15px] text-muted">A pocket passbook for spending, budgets, rent and savings goals. Works offline once installed.</p>
    </div>
  );
}
