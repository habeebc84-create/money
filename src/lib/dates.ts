/** All dates are local calendar dates as "YYYY-MM-DD" strings (no time zones involved). */
export type ISODate = string;
export type MonthKey = string; // "YYYY-MM"

const RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isISODate(s: unknown): s is ISODate {
  if (typeof s !== "string") return false;
  const m = RE.exec(s);
  if (!m) return false;
  const y = +m[1], mo = +m[2], d = +m[3];
  if (y < 1900 || y > 2200 || mo < 1 || mo > 12) return false;
  return d >= 1 && d <= daysInMonth(y, mo);
}

export function daysInMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

export function toISO(y: number, m1: number, d: number): ISODate {
  return `${String(y).padStart(4, "0")}-${String(m1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function todayISO(now: Date = new Date()): ISODate {
  return toISO(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function parts(d: ISODate): [number, number, number] {
  const [y, m, day] = d.split("-").map(Number);
  return [y, m, day];
}

export function monthKey(d: ISODate): MonthKey {
  return d.slice(0, 7);
}

export function addMonthsClamped(d: ISODate, n: number, anchorDay?: number): ISODate {
  const [y, m, day] = parts(d);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12), nm = (total % 12) + 1;
  const want = anchorDay ?? day;
  return toISO(ny, nm, Math.min(want, daysInMonth(ny, nm)));
}

export function addDays(d: ISODate, n: number): ISODate {
  const [y, m, day] = parts(d);
  const dt = new Date(Date.UTC(y, m - 1, day + n));
  return toISO(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export function shiftMonth(mk: MonthKey, n: number): MonthKey {
  return addMonthsClamped(`${mk}-01`, n).slice(0, 7);
}

export function monthLabel(mk: MonthKey): string {
  const [y, m] = mk.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function shortDate(d: ISODate): string {
  const [y, m, day] = parts(d);
  return new Date(y, m - 1, day).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function longDate(d: ISODate): string {
  const [y, m, day] = parts(d);
  return new Date(y, m - 1, day).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
