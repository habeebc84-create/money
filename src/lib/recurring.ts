import type { Entry, Frequency, Recurring } from "./types";
import { addDays, addMonthsClamped, parts, type ISODate } from "./dates";

export const MAX_CATCH_UP = 120; // safety cap on how many entries one rule can create at once

export function nextOccurrence(date: ISODate, frequency: Frequency, anchorDay: number): ISODate {
  switch (frequency) {
    case "weekly":
      return addDays(date, 7);
    case "monthly":
      return addMonthsClamped(date, 1, anchorDay);
    case "yearly":
      return addMonthsClamped(date, 12, anchorDay);
  }
}

/** Dedupe key so the same rule never posts twice for the same date. */
export function occurrenceKey(recurringId: string, date: ISODate): string {
  return `${recurringId}@${date}`;
}

export interface CatchUpResult {
  created: Entry[];
  rules: Recurring[];
}

/**
 * Post every due occurrence (nextDate <= today) for active rules, then advance nextDate.
 * Idempotent: existing entries with the same recurringId+date are not duplicated.
 */
export function catchUpRecurring(
  rules: Recurring[],
  existing: Entry[],
  today: ISODate,
  makeId: () => string,
  now: number = Date.now(),
): CatchUpResult {
  const seen = new Set(existing.filter((e) => e.recurringId).map((e) => occurrenceKey(e.recurringId!, e.date)));
  const created: Entry[] = [];
  const updated = rules.map((r) => {
    if (!r.active) return r;
    const anchor = parts(r.startDate)[2];
    let next = r.nextDate;
    let guard = 0;
    while (next <= today && guard < MAX_CATCH_UP) {
      const key = occurrenceKey(r.id, next);
      if (!seen.has(key)) {
        seen.add(key);
        created.push({
          id: makeId(),
          type: r.type,
          amount: r.amount,
          category: r.category,
          date: next,
          note: r.note,
          method: r.method,
          recurringId: r.id,
          sample: r.sample,
          createdAt: now,
        });
      }
      next = nextOccurrence(next, r.frequency, anchor);
      guard++;
    }
    return next === r.nextDate ? r : { ...r, nextDate: next };
  });
  return { created, rules: updated };
}

/** Monthly cost of a rule, for the "committed every month" figure. */
export function monthlyEquivalent(r: Pick<Recurring, "amount" | "frequency">): number {
  switch (r.frequency) {
    case "weekly":
      return Math.round((r.amount * 52) / 12);
    case "monthly":
      return r.amount;
    case "yearly":
      return Math.round(r.amount / 12);
  }
}

/** When a paused rule is resumed, skip the dates missed while paused (no back-filling). */
export function resumeNextDate(r: Pick<Recurring, "nextDate" | "frequency" | "startDate">, today: ISODate): ISODate {
  const anchor = parts(r.startDate)[2];
  let next = r.nextDate;
  let guard = 0;
  while (next < today && guard < 5000) { next = nextOccurrence(next, r.frequency, anchor); guard++; }
  return next;
}
