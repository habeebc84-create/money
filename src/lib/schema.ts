import { z } from "zod";
import { isISODate } from "./dates";
import { ALL_CATEGORIES, METHOD_IDS } from "./categories";
import { MAX_AMOUNT_PAISE, MIN_AMOUNT_PAISE } from "./money";

export const MAX_NOTE = 140;
export const MAX_NAME = 60;
export const MAX_ENTRIES = 20_000;

const paise = z.number().int().min(MIN_AMOUNT_PAISE).max(MAX_AMOUNT_PAISE);
const isoDate = z.string().refine(isISODate, "Invalid date");
const category = z.string().refine((c) => ALL_CATEGORIES.includes(c), "Unknown category");
const method = z.enum(METHOD_IDS as [string, ...string[]]);
const id = z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/);
const text = (max: number) => z.string().max(max).transform(cleanText);

/** Remove control characters and trim. Text is only ever rendered as React text, never as HTML. */
export function cleanText(s: string): string {
  return s.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
}

export const entrySchema = z.object({
  id,
  type: z.enum(["expense", "income"]),
  amount: paise,
  category,
  date: isoDate,
  note: text(MAX_NOTE),
  method,
  recurringId: id.optional(),
  sample: z.boolean().optional(),
  createdAt: z.number().int().nonnegative(),
});

export const recurringSchema = z.object({
  id,
  type: z.enum(["expense", "income"]),
  amount: paise,
  category,
  note: text(MAX_NOTE),
  method,
  frequency: z.enum(["weekly", "monthly", "yearly"]),
  startDate: isoDate,
  nextDate: isoDate,
  active: z.boolean(),
  sample: z.boolean().optional(),
});

export const goalSchema = z.object({
  id,
  name: text(MAX_NAME).refine((s) => s.length > 0, "Name required"),
  target: paise,
  saved: z.number().int().min(0).max(MAX_AMOUNT_PAISE),
  deadline: isoDate.optional(),
  sample: z.boolean().optional(),
});

export const dataSchema = z.object({
  version: z.literal(1),
  entries: z.array(entrySchema).max(MAX_ENTRIES),
  budgets: z
    .record(z.string(), paise)
    .refine((b) => Object.keys(b).every((k) => ALL_CATEGORIES.includes(k)), "Unknown budget category"),
  recurring: z.array(recurringSchema).max(200),
  goals: z.array(goalSchema).max(100),
});
