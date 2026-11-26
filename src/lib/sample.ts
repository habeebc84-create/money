import type { AppData, Entry, Goal, Recurring } from "./types";
import { addMonthsClamped, monthKey, todayISO, toISO, parts, daysInMonth } from "./dates";
import type { PaymentMethod } from "./categories";

/**
 * Clearly-labelled SAMPLE data so the app can be explored. Every record carries sample: true
 * and can be removed in one tap from Settings. None of it is real spending.
 */
export function buildSample(makeId: () => string, today = todayISO()): Pick<AppData, "entries" | "budgets" | "recurring" | "goals"> {
  const [y, m, d] = parts(today);
  const entries: Entry[] = [];
  const add = (mk: string, day: number, type: Entry["type"], amount: number, category: string, note: string, method: PaymentMethod) => {
    const [yy, mm] = mk.split("-").map(Number);
    const dd = Math.min(day, daysInMonth(yy, mm));
    const date = toISO(yy, mm, dd);
    if (date > today) return;
    entries.push({ id: makeId(), type, amount, category, date, note, method, sample: true, createdAt: Date.now() + entries.length });
  };
  const months = [-2, -1, 0].map((n) => monthKey(addMonthsClamped(toISO(y, m, 1), n)));
  months.forEach((mk, i) => {
    add(mk, 1, "income", 800000, "Pocket money", "Sample: from home", "bank");
    add(mk, 5, "expense", 600000, "Rent & hostel", "Sample: room share", "upi");
    add(mk, 3, "expense", 29900, "Mobile & internet", "Sample: prepaid recharge", "upi");
    add(mk, 7, "expense", 14900, "Subscriptions", "Sample: music plan", "card");
    add(mk, 12, "income", i === 1 ? 300000 : 150000, "Freelance", "Sample: poster design", "upi");
    for (let day = 2; day <= 28; day += 2) {
      add(mk, day, "expense", 4000 + ((day * 37 + i * 11) % 9) * 1000, "Food & tea", "Sample: canteen", day % 4 === 0 ? "cash" : "upi");
    }
    for (let day = 4; day <= 28; day += 6) add(mk, day, "expense", 3000 + (day % 5) * 1500, "Transport", "Sample: bus / auto", "cash");
    add(mk, 15, "expense", 85000 + i * 20000, "Groceries", "Sample: monthly groceries", "upi");
    add(mk, 18, "expense", 45000, "Education", "Sample: printouts and lab record", "cash");
    add(mk, 21, "expense", 60000 + i * 35000, "Fun & outings", "Sample: movie with friends", "upi");
    add(mk, 24, "expense", 99900, "Shopping", "Sample: earphones", "card");
  });
  const cur = monthKey(today);
  if (d >= 1) add(cur, d, "expense", 6000, "Food & tea", "Sample: today's tea and snacks", "upi");
  const budgets: Record<string, number> = {
    "Food & tea": 300000, Groceries: 100000, "Rent & hostel": 600000, Transport: 60000,
    "Mobile & internet": 30000, Subscriptions: 20000, "Fun & outings": 80000, Shopping: 80000,
  };
  const nextMonthDay = (day: number) => {
    const thisMonth = toISO(y, m, Math.min(day, daysInMonth(y, m)));
    return thisMonth > today ? thisMonth : addMonthsClamped(thisMonth, 1, day);
  };
  const recurring: Recurring[] = [
    { id: makeId(), type: "expense", amount: 600000, category: "Rent & hostel", note: "Sample: room share", method: "upi", frequency: "monthly", startDate: toISO(y, m, 5), nextDate: nextMonthDay(5), active: true, sample: true },
    { id: makeId(), type: "expense", amount: 14900, category: "Subscriptions", note: "Sample: music plan", method: "card", frequency: "monthly", startDate: toISO(y, m, 7), nextDate: nextMonthDay(7), active: true, sample: true },
  ];
  const goals: Goal[] = [
    { id: makeId(), name: "Sample: new laptop", target: 6000000, saved: 1250000, deadline: addMonthsClamped(today, 8), sample: true },
    { id: makeId(), name: "Sample: trip home", target: 300000, saved: 210000, sample: true },
  ];
  return { entries, budgets, recurring, goals };
}
