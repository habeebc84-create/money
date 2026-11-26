import { describe, expect, it } from "vitest";
import { catchUpRecurring, monthlyEquivalent, nextOccurrence, resumeNextDate } from "@/lib/recurring";
import type { Recurring } from "@/lib/types";

let n = 0;
const id = () => `id${++n}`;
const rule = (p: Partial<Recurring>): Recurring => ({
  id: "rent", type: "expense", amount: 600000, category: "Rent & hostel", note: "Room rent",
  method: "upi", frequency: "monthly", startDate: "2026-09-05", nextDate: "2026-09-05", active: true, ...p,
});

describe("nextOccurrence", () => {
  it("clamps month-end anchors and restores the anchor day later", () => {
    expect(nextOccurrence("2026-01-31", "monthly", 31)).toBe("2026-02-28");
    expect(nextOccurrence("2026-02-28", "monthly", 31)).toBe("2026-03-31");
    expect(nextOccurrence("2028-01-31", "monthly", 31)).toBe("2028-02-29");
    expect(nextOccurrence("2026-12-28", "weekly", 28)).toBe("2027-01-04");
    expect(nextOccurrence("2028-02-29", "yearly", 29)).toBe("2029-02-28");
  });
});

describe("catchUpRecurring", () => {
  it("posts every missed occurrence up to today and advances nextDate", () => {
    const { created, rules } = catchUpRecurring([rule({})], [], "2026-11-25", id, 1);
    expect(created.map((c) => c.date)).toEqual(["2026-09-05", "2026-10-05", "2026-11-05"]);
    expect(created.every((c) => c.recurringId === "rent" && c.amount === 600000)).toBe(true);
    expect(rules[0].nextDate).toBe("2026-12-05");
  });

  it("is idempotent: running again creates nothing", () => {
    const first = catchUpRecurring([rule({})], [], "2026-11-25", id);
    const second = catchUpRecurring(first.rules, first.created, "2026-11-25", id);
    expect(second.created).toEqual([]);
    expect(second.rules[0]).toBe(first.rules[0]);
  });

  it("does not duplicate an occurrence that already exists even if nextDate was stale", () => {
    const first = catchUpRecurring([rule({})], [], "2026-11-25", id);
    const again = catchUpRecurring([rule({})], first.created, "2026-11-25", id);
    expect(again.created).toEqual([]);
  });

  it("skips paused rules and future rules", () => {
    const { created } = catchUpRecurring([rule({ active: false }), rule({ id: "netflix", nextDate: "2026-12-01", startDate: "2026-12-01" })], [], "2026-11-25", id);
    expect(created).toEqual([]);
  });

  it("caps runaway catch-up", () => {
    const { created } = catchUpRecurring([rule({ frequency: "weekly", startDate: "1990-01-01", nextDate: "1990-01-01" })], [], "2026-11-25", id);
    expect(created.length).toBe(120);
  });

  it("converts to a monthly equivalent", () => {
    expect(monthlyEquivalent({ amount: 1200, frequency: "yearly" })).toBe(100);
    expect(monthlyEquivalent({ amount: 1000, frequency: "weekly" })).toBe(4333);
  });
});

describe("resumeNextDate", () => {
  it("skips dates missed while paused without back-filling", () => {
    expect(resumeNextDate({ nextDate: "2026-08-05", frequency: "monthly", startDate: "2026-01-05" }, "2026-11-25")).toBe("2026-12-05");
    expect(resumeNextDate({ nextDate: "2026-11-25", frequency: "monthly", startDate: "2026-01-25" }, "2026-11-25")).toBe("2026-11-25");
    expect(resumeNextDate({ nextDate: "2026-11-01", frequency: "weekly", startDate: "2026-11-01" }, "2026-11-25")).toBe("2026-11-29");
  });
});
