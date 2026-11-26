import type { AppData, Entry } from "./types";
import { monthKey, type MonthKey } from "./dates";

export interface MonthTotals {
  income: number;
  spent: number;
  /** income - spent (can be negative) */
  net: number;
}

export function entriesInMonth(entries: Entry[], mk: MonthKey): Entry[] {
  return entries.filter((e) => monthKey(e.date) === mk);
}

export function monthTotals(entries: Entry[], mk: MonthKey): MonthTotals {
  let income = 0, spent = 0;
  for (const e of entries) {
    if (monthKey(e.date) !== mk) continue;
    if (e.type === "income") income += e.amount;
    else spent += e.amount;
  }
  return { income, spent, net: income - spent };
}

export function spentByCategory(entries: Entry[], mk: MonthKey): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of entries) {
    if (e.type !== "expense" || monthKey(e.date) !== mk) continue;
    m.set(e.category, (m.get(e.category) ?? 0) + e.amount);
  }
  return m;
}

export type BudgetStatus = "ok" | "warn" | "over";

export interface BudgetLine {
  category: string;
  limit: number;
  spent: number;
  left: number; // limit - spent, can be negative
  /** 0..1+ fraction of limit used */
  ratio: number;
  status: BudgetStatus;
}

/** Warn at 80% of the limit, "over" once spending passes the limit. */
export const WARN_AT = 0.8;

export function budgetStatus(spent: number, limit: number): BudgetStatus {
  if (limit <= 0) return "ok";
  if (spent > limit) return "over";
  if (spent >= limit * WARN_AT) return "warn";
  return "ok";
}

export function budgetLines(data: Pick<AppData, "entries" | "budgets">, mk: MonthKey): BudgetLine[] {
  const spent = spentByCategory(data.entries, mk);
  return Object.entries(data.budgets)
    .filter(([, limit]) => limit > 0)
    .map(([category, limit]) => {
      const s = spent.get(category) ?? 0;
      return { category, limit, spent: s, left: limit - s, ratio: s / limit, status: budgetStatus(s, limit) };
    })
    .sort((a, b) => b.ratio - a.ratio);
}

export interface BudgetSummary {
  totalLimit: number;
  budgetedSpent: number;
  left: number;
  overCount: number;
  warnCount: number;
}

export function budgetSummary(lines: BudgetLine[]): BudgetSummary {
  const totalLimit = lines.reduce((a, l) => a + l.limit, 0);
  const budgetedSpent = lines.reduce((a, l) => a + l.spent, 0);
  return {
    totalLimit,
    budgetedSpent,
    left: totalLimit - budgetedSpent,
    overCount: lines.filter((l) => l.status === "over").length,
    warnCount: lines.filter((l) => l.status === "warn").length,
  };
}

/** Daily spend for every day of the month, for the trend chart. */
export function dailySpend(entries: Entry[], mk: MonthKey, days: number): number[] {
  const out = new Array<number>(days).fill(0);
  for (const e of entries) {
    if (e.type !== "expense" || monthKey(e.date) !== mk) continue;
    const d = Number(e.date.slice(8, 10));
    if (d >= 1 && d <= days) out[d - 1] += e.amount;
  }
  return out;
}

/** Remaining money per remaining day, given what's left of income (or budget). */
export function perDayAllowance(left: number, daysRemaining: number): number {
  if (left <= 0 || daysRemaining <= 0) return 0;
  return Math.floor(left / daysRemaining);
}
