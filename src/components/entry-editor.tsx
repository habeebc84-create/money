"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Sheet } from "./ui/sheet";
import { Button } from "./ui/button";
import { Field, Segmented, describedBy, inputClass } from "./ui/field";
import { useStore } from "./store";
import { useToast } from "./toast";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS, categoryColor, type PaymentMethod } from "@/lib/categories";
import { parseAmount, paiseToPlain } from "@/lib/money";
import { isISODate, todayISO } from "@/lib/dates";
import { newId } from "@/lib/ids";
import { MAX_NOTE } from "@/lib/schema";
import type { Entry, EntryType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface EditorApi { openNew: (type?: EntryType) => void; openEdit: (e: Entry) => void }
const Ctx = createContext<EditorApi>({ openNew: () => {}, openEdit: () => {} });
export const useEntryEditor = () => useContext(Ctx);

export function EntryEditorProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [initialType, setInitialType] = useState<EntryType>("expense");
  const [formKey, setFormKey] = useState(0);

  const openNew = useCallback((type: EntryType = "expense") => {
    setEditing(null); setInitialType(type); setFormKey((k) => k + 1); setOpen(true);
  }, []);
  const openEdit = useCallback((e: Entry) => {
    setEditing(e); setInitialType(e.type); setFormKey((k) => k + 1); setOpen(true);
  }, []);

  // Keyboard shortcut: "n" adds a new entry (ignored while typing in a field).
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement | null;
      if (ev.key.toLowerCase() !== "n" || ev.metaKey || ev.ctrlKey || ev.altKey) return;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (document.querySelector("[role=dialog]")) return;
      ev.preventDefault();
      openNew();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openNew]);

  return (
    <Ctx.Provider value={{ openNew, openEdit }}>
      {children}
      <Sheet open={open} onOpenChange={setOpen} title={editing ? "Edit entry" : initialType === "income" ? "Add money in" : "Add spending"}>
        <EntryForm key={formKey} editing={editing} initialType={initialType} onDone={() => setOpen(false)} />
      </Sheet>
    </Ctx.Provider>
  );
}

function EntryForm({ editing, initialType, onDone }: { editing: Entry | null; initialType: EntryType; onDone: () => void }) {
  const { upsertEntry, deleteEntry } = useStore();
  const toast = useToast();
  const [type, setType] = useState<EntryType>(initialType);
  const [amount, setAmount] = useState(editing ? paiseToPlain(editing.amount) : "");
  const [category, setCategory] = useState<string>(editing?.category ?? (initialType === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]));
  const [date, setDate] = useState(editing?.date ?? todayISO());
  const [method, setMethod] = useState<PaymentMethod>(editing?.method ?? "upi");
  const [note, setNote] = useState(editing?.note ?? "");
  const [errors, setErrors] = useState<{ amount?: string; date?: string }>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const cats: readonly string[] = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const switchType = (t: EntryType) => {
    setType(t);
    const list: readonly string[] = t === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!list.includes(category)) setCategory(list[0]);
  };

  const submit = (ev: React.SyntheticEvent) => {
    ev.preventDefault();
    const a = parseAmount(amount);
    const next: { amount?: string; date?: string } = {};
    if (!a.ok) next.amount = a.error;
    if (!isISODate(date)) next.date = "Pick a valid date.";
    setErrors(next);
    if (!a.ok || next.date) {
      document.getElementById(next.amount ? "amount" : "date")?.focus();
      return;
    }
    const ok = upsertEntry({
      id: editing?.id ?? newId(),
      type, amount: a.paise, category, date, method,
      note: note.slice(0, MAX_NOTE),
      recurringId: editing?.recurringId,
      createdAt: editing?.createdAt ?? Date.now(),
    });
    if (!ok) { toast("That entry didn't pass the checks. Nothing was saved.", "error"); return; }
    toast(editing ? "Entry updated" : type === "income" ? "Money in added" : "Spending added");
    onDone();
  };

  return (
    <div className="grid gap-5" role="group" aria-label="Entry details" onKeyDown={(e) => { if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") submit(e); }}>
      <Segmented name="type" legend="Type" value={type} onChange={switchType} options={[{ value: "expense", label: "Spent" }, { value: "income", label: "Money in" }]} />

      <Field label="Amount (₹)" htmlFor="amount" error={errors.amount}>
        <div className="relative">
          <span className="figures pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-2xl text-muted" aria-hidden>₹</span>
          <input
            id="amount" inputMode="decimal" autoComplete="off" autoFocus placeholder="0"
            value={amount} onChange={(e) => setAmount(e.target.value)}
            aria-invalid={!!errors.amount} aria-describedby={describedBy("amount", errors.amount)}
            className={cn(inputClass, "figures h-16 pl-10 text-3xl font-medium")}
          />
        </div>
      </Field>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink-2">Category</legend>
        <div className="flex flex-wrap gap-1.5">
          {cats.map((c) => (
            <label key={c} className="relative">
              <input type="radio" name="category" value={c} checked={category === c} onChange={() => setCategory(c)} className="peer sr-only" />
              <span className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-rule-strong px-3 text-sm text-ink-2 transition-colors hover:border-ink peer-checked:border-ink peer-checked:bg-paper-2 peer-checked:font-semibold peer-checked:text-ink peer-focus-visible:outline peer-focus-visible:outline-[2.5px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]">
                <span className="size-2.5 rounded-full" style={{ background: categoryColor(c, cats) }} aria-hidden />
                {c}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date" htmlFor="date" error={errors.date}>
          <input id="date" type="date" value={date} max="2200-12-31" onChange={(e) => setDate(e.target.value)} aria-invalid={!!errors.date} aria-describedby={describedBy("date", errors.date)} className={inputClass} />
        </Field>
        <Field label="Paid with" htmlFor="method">
          <select id="method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className={inputClass}>
            {PAYMENT_METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Note (optional)" htmlFor="note" hint={`${note.length}/${MAX_NOTE}`}>
        <input id="note" value={note} maxLength={MAX_NOTE} onChange={(e) => setNote(e.target.value)} placeholder={type === "income" ? "e.g. from Appa" : "e.g. canteen lunch"} aria-describedby="note-hint" className={inputClass} />
      </Field>

      {editing?.recurringId && <p className="text-xs text-muted">Added by a recurring rule. Editing here changes only this one entry.</p>}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button size="lg" className="flex-1" onClick={submit}>{editing ? "Save changes" : "Save"}</Button>
        {editing && !confirmDelete && (
          <Button variant="danger-outline" size="lg" onClick={() => setConfirmDelete(true)}><Trash2 aria-hidden />Delete</Button>
        )}
      </div>
      {editing && confirmDelete && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-danger-soft p-3" role="alertdialog" aria-label="Confirm delete">
          <p className="flex-1 text-sm font-medium text-danger">Delete this entry? This can&apos;t be undone.</p>
          <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Keep</Button>
          <Button variant="danger" size="sm" autoFocus onClick={() => { deleteEntry(editing.id); toast("Entry deleted"); onDone(); }}>Delete</Button>
        </div>
      )}
    </div>
  );
}
