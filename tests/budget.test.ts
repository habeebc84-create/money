import { describe, expect, it } from "vitest";
import { budgetLines, budgetStatus, budgetSummary, dailySpend, monthTotals, perDayAllowance } from "@/lib/budget";
import type { Entry } from "@/lib/types";

const e = (p: Partial<Entry>): Entry => ({
  id: Math.random().toString(36).slice(2), type: "expense", amount: 100, category: "Food & tea",
  date: "2026-11-05", note: "", method: "upi", createdAt: 0, ...p,
});

const entries: Entry[] = [
  e({ amount: 30000, category: "Food & tea", date: "2026-11-01" }),
  e({ amount: 15000, category: "Food & tea", date: "2026-11-03" }),
  e({ amount: 80000, category: "Rent & hostel", date: "2026-11-02" }),
  e({ amount: 5000, category: "Transport", date: "2026-10-30" }), // previous month
  e({ type: "income", amount: 500000, category: "Pocket money", date: "2026-11-01" }),
];

describe("month totals", () => {
  it("sums only the chosen month, splitting income and spend", () => {
    expect(monthTotals(entries, "2026-11")).toEqual({ income: 500000, spent: 125000, net: 375000 });
    expect(monthTotals(entries, "2026-10")).toEqual({ income: 0, spent: 5000, net: -5000 });
  });
});

describe("budget status", () => {
  it("is ok below 80%, warn from 80% up to the limit, over past it", () => {
    expect(budgetStatus(79, 100)).toBe("ok");
    expect(budgetStatus(80, 100)).toBe("warn");
    expect(budgetStatus(100, 100)).toBe("warn");
    expect(budgetStatus(101, 100)).toBe("over");
    expect(budgetStatus(50, 0)).toBe("ok");
  });

  it("builds lines per budgeted category, sorted by how much is used", () => {
    const lines = budgetLines({ entries, budgets: { "Food & tea": 50000, "Rent & hostel": 75000, Transport: 10000 } }, "2026-11");
    expect(lines.map((l) => [l.category, l.spent, l.left, l.status])).toEqual([
      ["Rent & hostel", 80000, -5000, "over"],
      ["Food & tea", 45000, 5000, "warn"],
      ["Transport", 0, 10000, "ok"],
    ]);
    expect(budgetSummary(lines)).toEqual({ totalLimit: 135000, budgetedSpent: 125000, left: 10000, overCount: 1, warnCount: 1 });
  });
});

describe("trend + allowance", () => {
  it("buckets spend per day of month", () => {
    const d = dailySpend(entries, "2026-11", 30);
    expect(d.length).toBe(30);
    expect(d[0]).toBe(30000);
    expect(d[1]).toBe(80000);
    expect(d[2]).toBe(15000);
    expect(d.reduce((a, b) => a + b, 0)).toBe(125000);
  });
  it("divides what's left across remaining days, never negative", () => {
    expect(perDayAllowance(10000, 4)).toBe(2500);
    expect(perDayAllowance(-1, 4)).toBe(0);
    expect(perDayAllowance(100, 0)).toBe(0);
  });
});
