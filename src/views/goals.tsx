"use client";

import { useState } from "react";
import { Minus, Plus, Trash2, Pencil } from "lucide-react";
import { useStore } from "@/components/store";
import { useToast } from "@/components/toast";
import { EmptyState, PageHeader, Progress } from "@/components/common";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, describedBy, inputClass } from "@/components/ui/field";
import { isISODate, longDate, parts, todayISO } from "@/lib/dates";
import { MAX_AMOUNT_PAISE, formatINR, paiseToPlain, parseAmount } from "@/lib/money";
import { newId } from "@/lib/ids";
import { MAX_NAME } from "@/lib/schema";
import type { Goal } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Whole months from today until the deadline (at least 1). */
export function monthsUntil(deadline: string, today = todayISO()): number {
  const [y1, m1, d1] = parts(today);
  const [y2, m2, d2] = parts(deadline);
  return Math.max(1, (y2 - y1) * 12 + (m2 - m1) + (d2 >= d1 ? 0 : -1) + 1);
}

export function GoalsView() {
  const { data, upsertGoal, deleteGoal } = useStore();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [k, setK] = useState(0);
  const startNew = () => { setEditing(null); setK((x) => x + 1); setOpen(true); };

  return (
    <div>
      <PageHeader title="Savings goals" lead="A laptop, a trip home, an emergency fund. Put money aside and watch it fill up." action={<Button onClick={startNew}><Plus aria-hidden />New goal</Button>} />
      {data.goals.length === 0 ? (
        <EmptyState title="No goals yet" body="Pick something you're saving for and how much it costs.">
          <Button onClick={startNew}><Plus aria-hidden />Add a goal</Button>
        </EmptyState>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {data.goals.map((g) => <GoalCard key={g.id} g={g} onEdit={() => { setEditing(g); setK((x) => x + 1); setOpen(true); }} onSave={upsertGoal} onDelete={() => { deleteGoal(g.id); toast("Goal deleted"); }} />)}
        </ul>
      )}
      <p className="mt-4 text-xs text-muted">Goals track money you set aside. They don&apos;t move money or change your passbook.</p>
      <Sheet open={open} onOpenChange={setOpen} title={editing ? "Edit goal" : "New goal"}>
        <GoalForm key={k} editing={editing} onSave={upsertGoal} onDone={(m) => { setOpen(false); toast(m); }} />
      </Sheet>
    </div>
  );
}

function GoalCard({ g, onEdit, onSave, onDelete }: { g: Goal; onEdit: () => void; onSave: (g: Goal) => boolean; onDelete: () => void }) {
  const toast = useToast();
  const [amt, setAmt] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const ratio = g.saved / g.target;
  const done = g.saved >= g.target;
  const remaining = Math.max(0, g.target - g.saved);
  const perMonth = g.deadline && !done ? Math.ceil(remaining / monthsUntil(g.deadline) / 100) * 100 : 0;
  const id = `g-${g.id}`;

  const move = (dir: 1 | -1) => {
    const r = parseAmount(amt);
    if (!r.ok) { setErr(r.error); return; }
    if (dir === -1 && r.paise > g.saved) { setErr(`You can take out at most ${formatINR(g.saved, true)}.`); return; }
    const saved = Math.min(MAX_AMOUNT_PAISE, g.saved + dir * r.paise);
    setErr(null); setAmt("");
    onSave({ ...g, saved });
    toast(dir === 1 ? `${formatINR(r.paise, true)} added to ${g.name}` : `${formatINR(r.paise, true)} taken from ${g.name}`);
  };

  return (
    <li className="rounded-3xl border border-rule bg-paper p-4 shadow-[var(--shadow)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-sans text-lg font-bold tracking-normal">{g.name}{g.sample && <span className="ml-2 rounded bg-warn-soft px-1.5 align-middle text-[10px] font-semibold text-warn">sample</span>}</h2>
          <p className="figures text-sm text-muted">{formatINR(g.saved)} of {formatINR(g.target)}</p>
        </div>
        <p className={cn("figures text-2xl font-semibold", done && "text-income")}>{Math.min(100, Math.floor(ratio * 100))}%</p>
      </div>
      <div className="mt-3"><Progress ratio={ratio} status="ok" label={`${g.name}: ${formatINR(g.saved)} of ${formatINR(g.target)} saved`} /></div>
      <p className="mt-2 text-sm text-muted">
        {done ? <span className="font-semibold text-income">Goal reached. Well done.</span>
          : g.deadline ? <>Save about <span className="figures font-semibold text-ink">{formatINR(perMonth)}</span> a month to reach it by {longDate(g.deadline)}.</>
          : <><span className="figures font-semibold text-ink">{formatINR(remaining)}</span> to go.</>}
      </p>
      <div className="mt-3 flex items-start gap-2">
        <div className="relative min-w-0 flex-1">
          <label htmlFor={id} className="sr-only">Amount to add to or take from {g.name}</label>
          <span className="figures pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden>₹</span>
          <input id={id} inputMode="decimal" placeholder="Amount" value={amt} onChange={(e) => setAmt(e.target.value)} aria-invalid={!!err} aria-describedby={err ? `${id}-err` : undefined} className={cn(inputClass, "figures h-11 pl-8")} />
        </div>
        <Button size="icon" aria-label={`Add to ${g.name}`} onClick={() => move(1)}><Plus aria-hidden /></Button>
        <Button size="icon" variant="outline" aria-label={`Take out of ${g.name}`} onClick={() => move(-1)} disabled={g.saved === 0}><Minus aria-hidden /></Button>
      </div>
      {err && <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm font-medium text-danger">{err}</p>}
      {confirm ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-danger-soft p-2.5" role="alertdialog" aria-label="Confirm delete goal">
          <p className="flex-1 text-sm font-medium text-danger">Delete this goal?</p>
          <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>Keep</Button>
          <Button size="sm" variant="danger" autoFocus onClick={onDelete}>Delete</Button>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="ghost" onClick={onEdit}><Pencil aria-hidden />Edit</Button>
          <Button size="sm" variant="ghost" className="text-danger" onClick={() => setConfirm(true)} aria-label={`Delete ${g.name}`}><Trash2 aria-hidden />Delete</Button>
        </div>
      )}
    </li>
  );
}

function GoalForm({ editing, onSave, onDone }: { editing: Goal | null; onSave: (g: Goal) => boolean; onDone: (m: string) => void }) {
  const [name, setName] = useState(editing?.name ?? "");
  const [target, setTarget] = useState(editing ? paiseToPlain(editing.target) : "");
  const [saved, setSaved] = useState(editing ? paiseToPlain(editing.saved) : "");
  const [deadline, setDeadline] = useState(editing?.deadline ?? "");
  const [e, setE] = useState<{ name?: string; target?: string; saved?: string; deadline?: string }>({});

  const submit = () => {
    const err: typeof e = {};
    const t = parseAmount(target);
    const s = saved.trim() === "" || saved.trim() === "0" ? { ok: true as const, paise: 0 } : parseAmount(saved);
    if (!name.trim()) err.name = "Give the goal a name.";
    if (!t.ok) err.target = t.error;
    if (!s.ok) err.saved = s.error;
    if (deadline && (!isISODate(deadline) || deadline < todayISO())) err.deadline = "Pick a date from today onwards, or leave it empty.";
    setE(err);
    if (Object.keys(err).length || !t.ok || !s.ok) return;
    const ok = onSave({ id: editing?.id ?? newId(), name: name.trim().slice(0, MAX_NAME), target: t.paise, saved: s.paise, deadline: deadline || undefined, sample: editing?.sample });
    if (!ok) { setE({ name: "That goal didn't pass the checks. Nothing was saved." }); return; }
    onDone(editing ? "Goal updated" : "Goal added");
  };

  return (
    <div className="grid gap-5">
      <Field label="What are you saving for?" htmlFor="g-name" error={e.name}><input id="g-name" value={name} maxLength={MAX_NAME} onChange={(x) => setName(x.target.value)} placeholder="e.g. New laptop" aria-invalid={!!e.name} aria-describedby={describedBy("g-name", e.name)} className={inputClass} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Target (₹)" htmlFor="g-target" error={e.target}><input id="g-target" inputMode="decimal" value={target} onChange={(x) => setTarget(x.target.value)} aria-invalid={!!e.target} aria-describedby={describedBy("g-target", e.target)} className={cn(inputClass, "figures")} /></Field>
        <Field label="Already saved (₹)" htmlFor="g-saved" error={e.saved}><input id="g-saved" inputMode="decimal" value={saved} onChange={(x) => setSaved(x.target.value)} placeholder="0" aria-invalid={!!e.saved} aria-describedby={describedBy("g-saved", e.saved)} className={cn(inputClass, "figures")} /></Field>
      </div>
      <Field label="By when? (optional)" htmlFor="g-deadline" error={e.deadline}><input id="g-deadline" type="date" value={deadline} min={todayISO()} onChange={(x) => setDeadline(x.target.value)} aria-invalid={!!e.deadline} aria-describedby={describedBy("g-deadline", e.deadline)} className={inputClass} /></Field>
      <Button size="lg" onClick={submit}>{editing ? "Save changes" : "Add goal"}</Button>
    </div>
  );
}
