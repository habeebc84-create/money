import type { Entry, EntryType } from "./types";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, METHOD_IDS, type PaymentMethod } from "./categories";
import { isISODate, toISO, type ISODate } from "./dates";
import { paiseToPlain, parseAmount } from "./money";
import { cleanText, MAX_NOTE } from "./schema";

export const CSV_HEADERS = ["date", "type", "amount", "category", "method", "note"] as const;
export const MAX_CSV_BYTES = 2 * 1024 * 1024;
export const MAX_CSV_ROWS = 10_000;

const FORMULA_START = /^[=+\-@\t\r]/;

/** Neutralise spreadsheet formula injection (CWE-1236) and quote per RFC 4180. */
export function csvCell(value: string): string {
  let v = value;
  if (FORMULA_START.test(v)) v = `'${v}`;
  if (/[",\n\r]/.test(v)) v = `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function entriesToCSV(entries: Entry[]): string {
  const rows = [...entries]
    .sort((a, b) => (a.date === b.date ? a.createdAt - b.createdAt : a.date < b.date ? -1 : 1))
    .map((e) => [e.date, e.type, paiseToPlain(e.amount), e.category, e.method, e.note].map(csvCell).join(","));
  return [CSV_HEADERS.join(","), ...rows].join("\r\n") + "\r\n";
}

/** Minimal RFC 4180 parser (quoted fields, escaped quotes, CRLF/LF). */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const s = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
      continue;
    }
    if (ch === '"' && field === "") inQuotes = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && s[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

/** Strip characters a spreadsheet would treat as a formula start, plus control chars. */
export function sanitizeImportedText(v: string, max = MAX_NOTE): string {
  let t = cleanText(v ?? "");
  t = t.replace(/^'(?=[=+\-@])/, ""); // our own export escape
  while (FORMULA_START.test(t) || /^[=+\-@]/.test(t)) t = t.slice(1).trimStart();
  return t.slice(0, max);
}

function parseDate(v: string): ISODate | null {
  const t = v.trim();
  if (isISODate(t)) return t;
  const m = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(t); // DD/MM/YYYY (India)
  if (m) {
    const iso = toISO(+m[3], +m[2], +m[1]);
    return isISODate(iso) ? iso : null;
  }
  return null;
}

const METHOD_ALIASES: Record<string, PaymentMethod> = {
  upi: "upi", gpay: "upi", "google pay": "upi", phonepe: "upi", paytm: "upi", bhim: "upi",
  cash: "cash",
  card: "card", "debit card": "card", "credit card": "card",
  bank: "bank", "bank transfer": "bank", neft: "bank", imps: "bank", rtgs: "bank",
};

export interface ImportRowError { line: number; reason: string }
export interface ImportResult {
  entries: Entry[];
  errors: ImportRowError[];
  /** rows whose category was unknown and mapped to Other */
  remapped: number;
}

export function importCSV(text: string, makeId: () => string, now = Date.now()): ImportResult {
  if (text.length > MAX_CSV_BYTES) {
    return { entries: [], errors: [{ line: 0, reason: "File is larger than 2 MB." }], remapped: 0 };
  }
  const rows = parseCSV(text);
  if (rows.length === 0) return { entries: [], errors: [{ line: 0, reason: "The file is empty." }], remapped: 0 };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = Object.fromEntries(CSV_HEADERS.map((h) => [h, header.indexOf(h)])) as Record<(typeof CSV_HEADERS)[number], number>;
  const missing = (["date", "type", "amount"] as const).filter((h) => idx[h] < 0);
  if (missing.length) {
    return { entries: [], errors: [{ line: 1, reason: `Missing column(s): ${missing.join(", ")}. Expected: ${CSV_HEADERS.join(", ")}.` }], remapped: 0 };
  }
  const entries: Entry[] = [];
  const errors: ImportRowError[] = [];
  let remapped = 0;
  const body = rows.slice(1);
  if (body.length > MAX_CSV_ROWS) errors.push({ line: 0, reason: `Only the first ${MAX_CSV_ROWS} rows were read.` });
  body.slice(0, MAX_CSV_ROWS).forEach((r, i) => {
    const line = i + 2;
    const get = (k: (typeof CSV_HEADERS)[number]) => (idx[k] >= 0 ? (r[idx[k]] ?? "") : "");
    const typeRaw = sanitizeImportedText(get("type"), 20).toLowerCase();
    const type: EntryType | null = typeRaw === "expense" || typeRaw === "income" ? typeRaw : null;
    if (!type) return errors.push({ line, reason: `Type must be "expense" or "income".` });
    const date = parseDate(get("date"));
    if (!date) return errors.push({ line, reason: "Date must be YYYY-MM-DD or DD/MM/YYYY." });
    const amt = parseAmount(get("amount"));
    if (!amt.ok) return errors.push({ line, reason: amt.error });
    const catRaw = sanitizeImportedText(get("category"), 40);
    const list: readonly string[] = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const found = list.find((c) => c.toLowerCase() === catRaw.toLowerCase());
    if (!found) remapped++;
    const category = found ?? (type === "expense" ? "Other" : "Other income");
    const methodRaw = sanitizeImportedText(get("method"), 20).toLowerCase();
    const method: PaymentMethod = METHOD_ALIASES[methodRaw] ?? (METHOD_IDS.includes(methodRaw as PaymentMethod) ? (methodRaw as PaymentMethod) : "cash");
    entries.push({
      id: makeId(),
      type,
      amount: amt.paise,
      category,
      date,
      note: sanitizeImportedText(get("note")),
      method,
      createdAt: now + i,
    });
  });
  return { entries, errors, remapped };
}

/** Skip rows that already exist (same date, type, amount, category and note). */
export function dedupeAgainst(existing: Entry[], incoming: Entry[]): { fresh: Entry[]; duplicates: number } {
  const key = (e: Entry) => [e.date, e.type, e.amount, e.category, e.note.toLowerCase()].join("|");
  const have = new Set(existing.map(key));
  const fresh: Entry[] = [];
  let duplicates = 0;
  for (const e of incoming) {
    const k = key(e);
    if (have.has(k)) duplicates++;
    else { have.add(k); fresh.push(e); }
  }
  return { fresh, duplicates };
}
