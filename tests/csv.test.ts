import { describe, expect, it } from "vitest";
import { csvCell, dedupeAgainst, entriesToCSV, importCSV, parseCSV, sanitizeImportedText } from "@/lib/csv";
import type { Entry } from "@/lib/types";

let n = 0;
const id = () => `r${++n}`;

const sample: Entry[] = [
  { id: "a", type: "expense", amount: 4550, category: "Food & tea", date: "2026-11-02", note: 'Tea, "samosa"\nwith Rafi', method: "cash", createdAt: 1 },
  { id: "b", type: "income", amount: 500000, category: "Pocket money", date: "2026-11-01", note: "=HYPERLINK(\"http://evil\")", method: "bank", createdAt: 2 },
];

describe("CSV export", () => {
  it("writes a header, sorts by date and escapes quotes/newlines", () => {
    const csv = entriesToCSV(sample);
    const lines = parseCSV(csv);
    expect(lines[0]).toEqual(["date", "type", "amount", "category", "method", "note"]);
    expect(lines[1][0]).toBe("2026-11-01");
    expect(lines[2][5]).toBe('Tea, "samosa"\nwith Rafi');
    expect(lines[2][2]).toBe("45.50");
  });
  it("neutralises formula injection", () => {
    expect(csvCell("=1+1")).toBe("'=1+1");
    expect(csvCell("+91 phone")).toBe("'+91 phone");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell("-2")).toBe("'-2");
    expect(entriesToCSV(sample)).toContain(`"'=HYPERLINK(""http://evil"")"`);
  });
});

describe("CSV import", () => {
  it("round-trips an export", () => {
    const res = importCSV(entriesToCSV(sample), id);
    expect(res.errors).toEqual([]);
    expect(res.entries.map((e) => [e.date, e.type, e.amount, e.category, e.method])).toEqual([
      ["2026-11-01", "income", 500000, "Pocket money", "bank"],
      ["2026-11-02", "expense", 4550, "Food & tea", "cash"],
    ]);
    // formula prefix stripped on the way back in
    expect(res.entries[0].note.startsWith("=")).toBe(false);
    expect(res.entries[0].note.startsWith("'")).toBe(false);
  });

  it("accepts Indian dates, ₹ amounts, payment aliases and maps unknown categories to Other", () => {
    const text = "Date,Type,Amount,Category,Method,Note\n25/11/2026,expense,\"₹1,200\",Petrol,GPay,bike\n";
    const res = importCSV(text, id);
    expect(res.errors).toEqual([]);
    expect(res.remapped).toBe(1);
    expect(res.entries[0]).toMatchObject({ date: "2026-11-25", amount: 120000, category: "Other", method: "upi", note: "bike" });
  });

  it("reports bad rows with line numbers and keeps the good ones", () => {
    const text = [
      "date,type,amount,category,method,note",
      "2026-11-01,expense,-50,Food & tea,upi,neg",
      "2026-13-01,expense,50,Food & tea,upi,bad month",
      "2026-11-01,transfer,50,Food & tea,upi,bad type",
      "2026-11-01,expense,1e9,Food & tea,upi,sci",
      "2026-11-02,expense,50,Food & tea,upi,ok",
    ].join("\n");
    const res = importCSV(text, id);
    expect(res.entries.length).toBe(1);
    expect(res.errors.map((e) => e.line)).toEqual([2, 3, 4, 5]);
  });

  it("rejects files without required columns", () => {
    const res = importCSV("foo,bar\n1,2", id);
    expect(res.entries).toEqual([]);
    expect(res.errors[0].reason).toMatch(/Missing column/);
  });

  it("strips formula starters and control chars from text", () => {
    expect(sanitizeImportedText("=cmd|' /C calc'!A0")).toBe("cmd|' /C calc'!A0");
    expect(sanitizeImportedText("+-@=x")).toBe("x");
    expect(sanitizeImportedText("a\u0007b")).toBe("a b");
  });

  it("dedupes identical rows on re-import", () => {
    const first = importCSV(entriesToCSV(sample), id).entries;
    const { fresh, duplicates } = dedupeAgainst(first, importCSV(entriesToCSV(sample), id).entries);
    expect(fresh).toEqual([]);
    expect(duplicates).toBe(2);
  });
});
