/** Money is stored as integer paise to avoid floating-point drift. */
export const MAX_AMOUNT_PAISE = 1_00_00_000_00; // ₹1,00,00,000 (one crore) per entry
export const MIN_AMOUNT_PAISE = 1; // ₹0.01

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const inrExact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatINR(paise: number, exact = false): string {
  const rupees = paise / 100;
  return (exact ? inrExact : inr).format(rupees);
}

/** Plain number for inputs/CSV, e.g. 123450 -> "1234.50" */
export function paiseToPlain(paise: number): string {
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export type ParseResult = { ok: true; paise: number } | { ok: false; error: string };

/**
 * Parse a user-typed rupee amount ("1,250", "₹ 99.5", "1250.75") into paise.
 * Rejects negatives, zero, more than 2 decimals, non-numbers and anything above one crore.
 */
export function parseAmount(input: string): ParseResult {
  const raw = String(input ?? "").trim();
  if (raw === "") return { ok: false, error: "Enter an amount." };
  const cleaned = raw.replace(/^(₹|rs\.?|inr)\s*/i, "").replace(/[,\s]/g, "");
  if (cleaned.startsWith("-")) return { ok: false, error: "Amount must be more than zero." };
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    if (/^\d+\.\d{3,}$/.test(cleaned)) return { ok: false, error: "Use at most 2 decimal places." };
    return { ok: false, error: "Enter a number, like 250 or 99.50." };
  }
  const [whole, frac = ""] = cleaned.split(".");
  if (whole.length > 10) return { ok: false, error: "That amount is too large (max ₹1,00,00,000)." };
  const paise = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  if (!Number.isSafeInteger(paise)) return { ok: false, error: "That amount is too large." };
  if (paise < MIN_AMOUNT_PAISE) return { ok: false, error: "Amount must be more than zero." };
  if (paise > MAX_AMOUNT_PAISE) return { ok: false, error: "That amount is too large (max ₹1,00,00,000)." };
  return { ok: true, paise };
}

export function isValidPaise(n: unknown): n is number {
  return typeof n === "number" && Number.isSafeInteger(n) && n >= MIN_AMOUNT_PAISE && n <= MAX_AMOUNT_PAISE;
}
