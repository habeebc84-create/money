export const EXPENSE_CATEGORIES = [
  "Food & tea",
  "Groceries",
  "Rent & hostel",
  "Transport",
  "Mobile & internet",
  "Subscriptions",
  "Education",
  "Shopping",
  "Health",
  "Fun & outings",
  "Family",
  "Other",
] as const;

export const INCOME_CATEGORIES = [
  "Pocket money",
  "Stipend",
  "Scholarship",
  "Part-time work",
  "Freelance",
  "Gift",
  "Refund",
  "Other income",
] as const;

export const PAYMENT_METHODS = [
  { id: "upi", label: "UPI" },
  { id: "cash", label: "Cash" },
  { id: "card", label: "Card" },
  { id: "bank", label: "Bank transfer" },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["id"];
export const METHOD_IDS = PAYMENT_METHODS.map((m) => m.id) as PaymentMethod[];

export function methodLabel(id: string): string {
  return PAYMENT_METHODS.find((m) => m.id === id)?.label ?? id;
}

/** Category colour tokens, cycled from the palette (CSS variables --cat-0 .. --cat-7). */
export function categoryColor(name: string, list: readonly string[] = EXPENSE_CATEGORIES): string {
  const i = Math.max(0, list.indexOf(name));
  return `var(--cat-${i % 8})`;
}

export const ALL_CATEGORIES: readonly string[] = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
