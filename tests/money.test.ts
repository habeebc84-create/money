import { describe, expect, it } from "vitest";
import { formatINR, paiseToPlain, parseAmount, MAX_AMOUNT_PAISE } from "@/lib/money";

describe("parseAmount", () => {
  it("parses plain, comma and rupee-prefixed amounts into paise", () => {
    expect(parseAmount("250")).toEqual({ ok: true, paise: 25000 });
    expect(parseAmount("1,250.5")).toEqual({ ok: true, paise: 125050 });
    expect(parseAmount("₹ 99.99")).toEqual({ ok: true, paise: 9999 });
    expect(parseAmount("Rs. 10")).toEqual({ ok: true, paise: 1000 });
  });
  it("rejects zero, negatives, junk, too many decimals and absurd sizes", () => {
    for (const bad of ["", "0", "0.00", "-5", "abc", "1e5", "12.345", "Infinity", "NaN", "99999999999"]) {
      expect(parseAmount(bad).ok, bad).toBe(false);
    }
    expect(parseAmount("10000000").ok).toBe(true); // exactly one crore
    expect(parseAmount("10000000.01").ok).toBe(false);
    expect(MAX_AMOUNT_PAISE).toBe(1_000_000_000);
  });
});

describe("formatting", () => {
  it("uses Indian digit grouping", () => {
    expect(formatINR(12345678900)).toBe("₹12,34,56,789");
    expect(formatINR(150, true)).toBe("₹1.50");
    expect(paiseToPlain(123405)).toBe("1234.05");
  });
});
