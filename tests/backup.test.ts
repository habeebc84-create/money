import { describe, expect, it } from "vitest";
import { makeBackup, readBackup } from "@/lib/backup";
import { EMPTY_DATA, type AppData } from "@/lib/types";

const data: AppData = {
  ...EMPTY_DATA,
  entries: [{ id: "a1", type: "expense", amount: 2000, category: "Transport", date: "2026-11-10", note: "auto", method: "cash", createdAt: 5 }],
  budgets: { Transport: 100000 },
  goals: [{ id: "g1", name: "New phone", target: 2000000, saved: 50000 }],
};

describe("JSON backup", () => {
  it("round-trips", () => {
    const r = readBackup(makeBackup(data));
    expect(r).toEqual({ ok: true, data });
  });
  it("rejects junk, foreign JSON and tampered values", () => {
    expect(readBackup("not json").ok).toBe(false);
    expect(readBackup(JSON.stringify({ app: "other", data })).ok).toBe(false);
    const bad = structuredClone(data);
    bad.entries[0].amount = -100;
    expect(readBackup(makeBackup(bad)).ok).toBe(false);
    const bad2 = structuredClone(data) as unknown as { budgets: Record<string, number> };
    bad2.budgets = { "__proto__x": 5 };
    expect(readBackup(JSON.stringify({ app: "kaasu", data: bad2 })).ok).toBe(false);
  });
});
