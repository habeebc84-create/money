import type { ISODate } from "./dates";
import type { PaymentMethod } from "./categories";

export type EntryType = "expense" | "income";

export interface Entry {
  id: string;
  type: EntryType;
  amount: number; // paise, > 0
  category: string;
  date: ISODate;
  note: string;
  method: PaymentMethod;
  recurringId?: string;
  sample?: boolean;
  createdAt: number;
}

export type Frequency = "weekly" | "monthly" | "yearly";

export interface Recurring {
  id: string;
  type: EntryType;
  amount: number;
  category: string;
  note: string;
  method: PaymentMethod;
  frequency: Frequency;
  startDate: ISODate;
  /** Next date an entry should be created on. */
  nextDate: ISODate;
  active: boolean;
  sample?: boolean;
}

export interface Goal {
  id: string;
  name: string;
  target: number; // paise
  saved: number; // paise, >= 0
  deadline?: ISODate;
  sample?: boolean;
}

export interface AppData {
  version: 1;
  entries: Entry[];
  budgets: Record<string, number>; // category -> monthly limit in paise
  recurring: Recurring[];
  goals: Goal[];
}

export const EMPTY_DATA: AppData = { version: 1, entries: [], budgets: {}, recurring: [], goals: [] };
