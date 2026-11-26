"use client";

import { useState } from "react";
import { Pause, Play, Pencil, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/components/store";
import { useToast } from "@/components/toast";
import { Card, EmptyState, PageHeader } from "@/components/common";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, Segmented, describedBy, inputClass } from "@/components/ui/field";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS, methodLabel, type PaymentMethod } from "@/lib/categories";
import { isISODate, longDate, todayISO } from "@/lib/dates";
import { formatINR, paiseToPlain, parseAmount } from "@/lib/money";
import { monthlyEquivalent, resumeNextDate } from "@/lib/recurring";
import { newId } from "@/lib/ids";
import { MAX_NOTE } from "@/lib/schema";
import type { EntryType, Frequency, Recurring } from "@/lib/types";
import { cn } from "@/lib/utils";

const FREQ: { value: Frequency; label: string }[] = [{ value: "weekly", label: "Weekly" }, { value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly" }];

export function RecurringView() {
  const { data, upsertRecurring, deleteRecurring } = useStore();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Recurring | null>(null);
  const [k, setK] = useState(0);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const rules = [...data.recurring].sort((a, b) => (a.nextDate < b.nextDate ? -1 : 1));
  const fixedOut = data.recurring.filter((r) => r.active && r.type === "expense").reduce((a, r) => a + monthlyEquivalent(r), 0);
  const fixedIn = data.recurring.filter((r) => r.active && r.type === "income").reduce((a, r) => a + monthlyEquivalent(r), 0);

  const startNew = () => { setEditing(null); setK((x) => x + 1); setOpen(true); };
  const startEdit = (r: Recurring) => { setEditing(r); setK((x) => x + 1); setOpen(true); };
  const toggle = (r: Recurring) => {
    const next = r.active ? { ...r, active: false } : { ...r, active: true, nextDate: resumeNextDate(r, todayISO()) };
    upsertRecurring(next);
    toast(r.active ? `${r.note || r.category} paused` : `${r.note || r.category} resumed`);
  };

  return (
    <div>
      <PageHeader title="Recurring" lead="Rent, hostel fees, phone recharge, subscriptions. Kaasu adds them to your passbook when the date arrives, the next time you open the app." action={<Button onClick={startNew}><Plus aria-hidden />New rule</Button>} />
      {rules.length === 0 ? (
        <EmptyState title="No recurring bills yet" body="Add things that repeat, like rent on the 5th or a ₹199 recharge every month.">
          <Button onClick={startNew}><Plus aria-hidden />Add a recurring bill</Button>
        </EmptyState>
      ) : (
        <>
          <Card className="mb-4">
            <dl className="grid grid-cols-2 gap-4">
              <div><dt className="text-sm text-muted">Fixed spending per month</dt><dd className="figures text-2xl font-semibold">{formatINR(fixedOut)}</dd></div>
              <div><dt className="text-sm text-muted">Regular money in per month</dt><dd className="figures text-2xl font-semibold text-income">{formatINR(fixedIn)}</dd></div>
            </dl>
          </Card>
          <ul className="grid gap-3 md:grid-cols-2">
            {rules.map((r) => (
              <li key={r.id} className={cn("rounded-3xl border border-rule bg-paper p-4 shadow-[var(--shadow)]", !r.active && "opacity-75")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-sans text-base font-semibold tracking-normal">{r.note || r.category}</h2>
                    <p className="text-sm text-muted">{r.category}, {methodLabel(r.method)}, {r.frequency}{r.sample ? " (sample)" : ""}</p>
                  </div>
                  <p className={cn("figures shrink-0 text-lg font-semibold", r.type === "income" && "text-income")}>{r.type === "income" ? "+" : "−"}{formatINR(r.amount, r.amount % 100 !== 0)}</p>
                </div>
                <p className="mt-2 text-sm">{r.active ? <>Next: <span className="font-semibold">{longDate(r.nextDate)}</span></> : <span className="font-semibold text-warn">Paused</span>}</p>
                {confirmId === r.id ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-danger-soft p-2.5" role="alertdialog" aria-label="Confirm delete rule">
                    <p className="flex-1 text-sm font-medium text-danger">Delete this rule? Past entries stay.</p>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmId(null)}>Keep</Button>
                    <Button size="sm" variant="danger" autoFocus onClick={() => { deleteRecurring(r.id); setConfirmId(null); toast("Rule deleted"); }}>Delete</Button>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggle(r)}>{r.active ? <><Pause aria-hidden />Pause</> : <><Play aria-hidden />Resume</>}</Button>
                    <Button size="sm" variant="outline" onClick={() => startEdit(r)}><Pencil aria-hidden />Edit</Button>
                    <Button size="sm" variant="danger-outline" onClick={() => setConfirmId(r.id)} aria-label={`Delete ${r.note || r.category}`}><Trash2 aria-hidden />Delete</Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      <Sheet open={open} onOpenChange={setOpen} title={editing ? "Edit recurring" : "New recurring"} description="If the first date is today or earlier, it is added straight away.">
        <RuleForm key={k} editing={editing} onDone={(msg) => { setOpen(false); toast(msg); }} onSave={upsertRecurring} />
      </Sheet>
    </div>
  );
}

function RuleForm({ editing, onDone, onSave }: { editing: Recurring | null; onDone: (msg: string) => void; onSave: (r: Recurring) => boolean }) {
  const [type, setType] = useState<EntryType>(editing?.type ?? "expense");
  const [amount, setAmount] = useState(editing ? paiseToPlain(editing.amount) : "");
  const [note, setNote] = useState(editing?.note ?? "");
  const [category, setCategory] = useState(editing?.category ?? "Rent & hostel");
  const [method, setMethod] = useState<PaymentMethod>(editing?.method ?? "upi");
  const [frequency, setFrequency] = useState<Frequency>(editing?.frequency ?? "monthly");
  const [start, setStart] = useState(editing?.nextDate ?? todayISO());
  const [err, setErr] = useState<{ amount?: string; start?: string; save?: string }>({});
  const cats: readonly string[] = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const save = () => {
    const a = parseAmount(amount);
    const e: typeof err = {};
    if (!a.ok) e.amount = a.error;
    if (!isISODate(start)) e.start = "Pick a valid date.";
    setErr(e);
    if (!a.ok || e.start) return;
    const cat = cats.includes(category) ? category : cats[0];
    const ok = onSave({
      id: editing?.id ?? newId(), type, amount: a.paise, category: cat, note: note.slice(0, MAX_NOTE), method, frequency,
      startDate: editing && editing.nextDate === start ? editing.startDate : start, nextDate: start, active: editing?.active ?? true, sample: editing?.sample,
    });
    if (!ok) { setErr({ save: "That rule didn't pass the checks. Nothing was saved." }); return; }
    onDone(editing ? "Rule updated" : "Rule added");
  };

  return (
    <div className="grid gap-5">
      <Segmented name="r-type" legend="Type" value={type} onChange={(t) => { setType(t); setCategory((t === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0]); }} options={[{ value: "expense", label: "Bill / spending" }, { value: "income", label: "Money in" }]} />
      <Field label="Name" htmlFor="r-note"><input id="r-note" value={note} maxLength={MAX_NOTE} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Room rent" className={inputClass} /></Field>
      <Field label="Amount (₹)" htmlFor="r-amount" error={err.amount}>
        <input id="r-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={!!err.amount} aria-describedby={describedBy("r-amount", err.amount)} className={cn(inputClass, "figures text-xl")} placeholder="0" />
      </Field>
      <Segmented name="r-freq" legend="Repeats" value={frequency} onChange={setFrequency} options={FREQ} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={editing ? "Next date" : "First date"} htmlFor="r-start" error={err.start}>
          <input id="r-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} aria-invalid={!!err.start} aria-describedby={describedBy("r-start", err.start)} className={inputClass} />
        </Field>
        <Field label="Category" htmlFor="r-cat">
          <select id="r-cat" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>{cats.map((c) => <option key={c}>{c}</option>)}</select>
        </Field>
        <Field label="Paid with" htmlFor="r-method">
          <select id="r-method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className={inputClass}>{PAYMENT_METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select>
        </Field>
      </div>
      {err.save && <p role="alert" className="text-sm font-medium text-danger">{err.save}</p>}
      <Button size="lg" onClick={save}>{editing ? "Save changes" : "Add rule"}</Button>
    </div>
  );
}
