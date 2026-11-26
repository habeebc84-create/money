"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { AppData, Entry, Goal, Recurring } from "@/lib/types";
import { EMPTY_DATA } from "@/lib/types";
import { loadData, saveData, STORAGE_KEY } from "@/lib/storage";
import { catchUpRecurring } from "@/lib/recurring";
import { todayISO } from "@/lib/dates";
import { newId } from "@/lib/ids";
import { buildSample } from "@/lib/sample";
import { entrySchema, goalSchema, recurringSchema, dataSchema } from "@/lib/schema";

type Status = "loading" | "ready" | "unavailable";

interface StoreValue {
  status: Status;
  data: AppData;
  notice: string | null;
  saveError: string | null;
  dismissNotice: () => void;
  upsertEntry: (e: Entry) => boolean;
  deleteEntry: (id: string) => void;
  addEntries: (list: Entry[]) => number;
  setBudget: (category: string, paise: number | null) => void;
  upsertRecurring: (r: Recurring) => boolean;
  deleteRecurring: (id: string) => void;
  upsertGoal: (g: Goal) => boolean;
  deleteGoal: (id: string) => void;
  replaceAll: (d: AppData) => boolean;
  loadSample: () => void;
  removeSample: () => void;
  eraseAll: () => void;
  hasSample: boolean;
}

const Ctx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const dataRef = useRef<AppData>(EMPTY_DATA);

  const hydrate = useCallback(() => {
    const res = loadData();
    let d = res.data;
    const { created, rules } = catchUpRecurring(d.recurring, d.entries, todayISO(), newId);
    if (created.length) {
      d = { ...d, entries: [...d.entries, ...created], recurring: rules };
      setNotice(`${created.length} recurring ${created.length === 1 ? "entry was" : "entries were"} added for dates that have arrived.`);
    }
    if (res.status === "recovered") setNotice(res.reason);
    dataRef.current = d;
    setData(d);
    if (created.length) saveData(d);
    setStatus(res.status === "unavailable" ? "unavailable" : "ready");
    if (res.status === "unavailable") setSaveError(res.reason);
  }, []);

  useEffect(() => {
    // Reading localStorage must happen after mount (static export renders without it).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    hydrate();
    const onStorage = (ev: StorageEvent) => { if (ev.key === STORAGE_KEY) hydrate(); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [hydrate]);

  const commit = useCallback((next: AppData) => {
    dataRef.current = next;
    setData(next);
    const r = saveData(next);
    setSaveError(r.ok ? null : r.error);
  }, []);

  const mutate = useCallback((fn: (d: AppData) => AppData) => {
    commit(fn(dataRef.current));
  }, [commit]);

  const value = useMemo<StoreValue>(() => ({
    status,
    data,
    notice,
    saveError,
    dismissNotice: () => setNotice(null),
    upsertEntry: (e) => {
      const p = entrySchema.safeParse(e);
      if (!p.success) return false;
      const clean = p.data as Entry;
      mutate((d) => ({ ...d, entries: d.entries.some((x) => x.id === clean.id) ? d.entries.map((x) => (x.id === clean.id ? clean : x)) : [...d.entries, clean] }));
      return true;
    },
    deleteEntry: (id) => mutate((d) => ({ ...d, entries: d.entries.filter((e) => e.id !== id) })),
    addEntries: (list) => {
      const ok = list.filter((e) => entrySchema.safeParse(e).success);
      mutate((d) => ({ ...d, entries: [...d.entries, ...ok] }));
      return ok.length;
    },
    setBudget: (category, paise) => mutate((d) => {
      const budgets = { ...d.budgets };
      if (paise === null || paise <= 0) delete budgets[category];
      else budgets[category] = paise;
      return { ...d, budgets };
    }),
    upsertRecurring: (r) => {
      const p = recurringSchema.safeParse(r);
      if (!p.success) return false;
      const clean = p.data as Recurring;
      mutate((d) => {
        const list = d.recurring.some((x) => x.id === clean.id) ? d.recurring.map((x) => (x.id === clean.id ? clean : x)) : [...d.recurring, clean];
        const { created, rules } = catchUpRecurring(list, d.entries, todayISO(), newId);
        return { ...d, recurring: rules, entries: [...d.entries, ...created] };
      });
      return true;
    },
    deleteRecurring: (id) => mutate((d) => ({ ...d, recurring: d.recurring.filter((r) => r.id !== id) })),
    upsertGoal: (g) => {
      const p = goalSchema.safeParse(g);
      if (!p.success) return false;
      const clean = p.data as Goal;
      mutate((d) => ({ ...d, goals: d.goals.some((x) => x.id === clean.id) ? d.goals.map((x) => (x.id === clean.id ? clean : x)) : [...d.goals, clean] }));
      return true;
    },
    deleteGoal: (id) => mutate((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id) })),
    replaceAll: (next) => {
      if (!dataSchema.safeParse(next).success) return false;
      commit(next);
      return true;
    },
    loadSample: () => mutate((d) => {
      const s = buildSample(newId);
      const budgets = { ...s.budgets, ...d.budgets };
      return { ...d, entries: [...d.entries.filter((e) => !e.sample), ...s.entries], budgets, recurring: [...d.recurring.filter((r) => !r.sample), ...s.recurring], goals: [...d.goals.filter((g) => !g.sample), ...s.goals] };
    }),
    removeSample: () => mutate((d) => ({ ...d, entries: d.entries.filter((e) => !e.sample), recurring: d.recurring.filter((r) => !r.sample), goals: d.goals.filter((g) => !g.sample) })),
    eraseAll: () => commit(EMPTY_DATA),
    hasSample: data.entries.some((e) => e.sample) || data.goals.some((g) => g.sample) || data.recurring.some((r) => r.sample),
  }), [status, data, notice, saveError, mutate, commit]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside StoreProvider");
  return v;
}
