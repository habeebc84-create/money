"use client";

import { Repeat } from "lucide-react";
import type { Entry } from "@/lib/types";
import { formatINR } from "@/lib/money";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, categoryColor, methodLabel } from "@/lib/categories";
import { useEntryEditor } from "./entry-editor";

/** One passbook line: particulars, dotted leader, amount. The whole row is a button that opens the editor. */
export function EntryRow({ e }: { e: Entry }) {
  const { openEdit } = useEntryEditor();
  const list: readonly string[] = e.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return (
    <li>
      <button onClick={() => openEdit(e)} className="group flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-paper-2" aria-label={`${e.type === "income" ? "Money in" : "Spent"} ${formatINR(e.amount, true)}, ${e.category}${e.note ? `, ${e.note}` : ""}, ${methodLabel(e.method)}. Edit`}>
        <span className="grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-bold text-paper" style={{ background: categoryColor(e.category, list) }} aria-hidden>
          {e.category.slice(0, 1)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="truncate text-[15px] font-semibold">{e.note || e.category}</span>
            <span className="leader hidden sm:block" aria-hidden />
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted">
            {e.note ? `${e.category}, ` : ""}{methodLabel(e.method)}
            {e.recurringId && <Repeat className="size-3" aria-label="recurring" />}
            {e.sample && <span className="rounded bg-warn-soft px-1.5 text-[10px] font-semibold text-warn">sample</span>}
          </span>
        </span>
        <span className={`figures shrink-0 text-[15px] font-semibold ${e.type === "income" ? "text-income" : "text-ink"}`}>
          {e.type === "income" ? "+" : "−"}{formatINR(e.amount, e.amount % 100 !== 0)}
        </span>
      </button>
    </li>
  );
}
