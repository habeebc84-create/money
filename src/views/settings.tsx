"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Upload, FileJson, FileSpreadsheet, Sparkles, Trash2, Smartphone, ShieldCheck } from "lucide-react";
import { useStore } from "@/components/store";
import { useToast } from "@/components/toast";
import { useTheme, type ThemePref } from "@/components/theme";
import { Card, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Segmented, inputClass } from "@/components/ui/field";
import { MAX_CSV_BYTES, dedupeAgainst, entriesToCSV, importCSV, type ImportResult } from "@/lib/csv";
import { MAX_BACKUP_BYTES, makeBackup, readBackup } from "@/lib/backup";
import { newId } from "@/lib/ids";
import { todayISO } from "@/lib/dates";
import { MAX_ENTRIES } from "@/lib/schema";
import type { AppData } from "@/lib/types";

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.rel = "noopener";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

export function SettingsView() {
  const { data, addEntries, replaceAll, loadSample, removeSample, eraseAll, hasSample } = useStore();
  const toast = useToast();
  const { pref, setPref } = useTheme();
  const csvRef = useRef<HTMLInputElement>(null);
  const jsonRef = useRef<HTMLInputElement>(null);
  const [report, setReport] = useState<(ImportResult & { added: number; duplicates: number }) | null>(null);
  const [pendingRestore, setPendingRestore] = useState<AppData | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [eraseText, setEraseText] = useState("");
  const [install, setInstall] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBIP = (e: Event) => { e.preventDefault(); setInstall(e as BIPEvent); };
    const onInstalled = () => { setInstalled(true); setInstall(null); };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    return () => { window.removeEventListener("beforeinstallprompt", onBIP); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  const exportCSV = () => {
    if (!data.entries.length) { toast("Nothing to export yet.", "error"); return; }
    const sorted = [...data.entries].sort((a, b) => (a.date < b.date ? -1 : 1));
    download(`kaasu-entries-${todayISO()}.csv`, entriesToCSV(sorted), "text/csv;charset=utf-8");
    toast(`Exported ${sorted.length} entries`);
  };

  const onCSV = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > MAX_CSV_BYTES) { toast("That file is over 2 MB. Split it and try again.", "error"); return; }
    const res = importCSV(await f.text(), newId);
    const { fresh, duplicates } = dedupeAgainst(data.entries, res.entries);
    const room = Math.max(0, MAX_ENTRIES - data.entries.length);
    const added = fresh.length ? addEntries(fresh.slice(0, room)) : 0;
    setReport({ ...res, added, duplicates });
    toast(added ? `Imported ${added} entries` : "No new entries were imported", added ? "success" : "error");
  };

  const onJSON = async (f: File | undefined) => {
    setRestoreError(null); setPendingRestore(null);
    if (!f) return;
    if (f.size > MAX_BACKUP_BYTES) { setRestoreError("That file is over 5 MB and isn't a Kaasu backup."); return; }
    const r = readBackup(await f.text());
    if (!r.ok) { setRestoreError(r.error); return; }
    setPendingRestore(r.data);
  };

  return (
    <div className="grid gap-4">
      <PageHeader title="Settings" lead="Theme, backups and your data." />

      <Card aria-labelledby="s-theme">
        <h2 id="s-theme" className="mb-3 text-lg font-bold">Appearance</h2>
        <Segmented<ThemePref> name="theme" legend="Theme" value={pref} onChange={setPref} options={[{ value: "system", label: "Match phone" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} />
      </Card>

      <Card aria-labelledby="s-backup">
        <h2 id="s-backup" className="text-lg font-bold">Backup and restore</h2>
        <p className="mt-1 text-sm text-muted">Your data lives only in this browser on this device. Clearing browser data or uninstalling deletes it, so save a backup now and then (to Drive or WhatsApp yourself).</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => { download(`kaasu-backup-${todayISO()}.json`, makeBackup(data), "application/json"); toast("Backup saved"); }}><FileJson aria-hidden />Save full backup</Button>
          <Button variant="outline" onClick={() => jsonRef.current?.click()}><Upload aria-hidden />Restore from backup</Button>
          <input ref={jsonRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-label="Choose backup file" onChange={(e) => { onJSON(e.target.files?.[0]); e.target.value = ""; }} />
        </div>
        {restoreError && <p role="alert" className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">Couldn&apos;t restore: {restoreError} Nothing was changed.</p>}
        {pendingRestore && (
          <div role="alertdialog" aria-label="Confirm restore" className="mt-3 grid gap-2 rounded-2xl bg-warn-soft p-3 text-sm">
            <p>This backup has <b>{pendingRestore.entries.length}</b> entries, <b>{pendingRestore.recurring.length}</b> recurring rules and <b>{pendingRestore.goals.length}</b> goals. Restoring <b>replaces everything</b> currently in Kaasu.</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" onClick={() => setPendingRestore(null)}>Cancel</Button>
              <Button size="sm" variant="accent" autoFocus onClick={() => { const ok = replaceAll(pendingRestore); setPendingRestore(null); toast(ok ? "Backup restored" : "Restore failed. Nothing changed.", ok ? "success" : "error"); }}>Replace and restore</Button>
            </div>
          </div>
        )}
      </Card>

      <Card aria-labelledby="s-csv">
        <h2 id="s-csv" className="text-lg font-bold">Spreadsheet (CSV)</h2>
        <p className="mt-1 text-sm text-muted">Open your entries in Excel or Google Sheets, or bring entries in. Columns: <code className="figures text-xs">date,type,amount,category,method,note</code>. Dates as YYYY-MM-DD or DD/MM/YYYY; type is expense or income.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCSV}><Download aria-hidden />Export CSV</Button>
          <Button variant="outline" onClick={() => csvRef.current?.click()}><FileSpreadsheet aria-hidden />Import CSV</Button>
          <input ref={csvRef} type="file" accept=".csv,text/csv" className="sr-only" tabIndex={-1} aria-label="Choose CSV file" onChange={(e) => { onCSV(e.target.files?.[0]); e.target.value = ""; }} />
        </div>
        {report && (
          <div className="mt-3 rounded-2xl bg-paper-2 p-3 text-sm" role="status">
            <p><b>{report.added}</b> added{report.duplicates ? `, ${report.duplicates} skipped as duplicates` : ""}{report.remapped ? `, ${report.remapped} with unknown categories filed under Other` : ""}{report.errors.length ? `, ${report.errors.length} rows skipped` : ""}.</p>
            {report.errors.length > 0 && (
              <ul className="mt-2 grid max-h-40 gap-1 overflow-y-auto text-xs text-muted">
                {report.errors.slice(0, 50).map((er, i) => <li key={i}>{er.line ? `Line ${er.line}: ` : ""}{er.reason}</li>)}
              </ul>
            )}
          </div>
        )}
      </Card>

      {(install || installed) && (
        <Card aria-labelledby="s-install">
          <h2 id="s-install" className="text-lg font-bold">Install on your phone</h2>
          {installed ? <p className="mt-1 text-sm text-muted">Kaasu is installed. It opens from your home screen and works offline.</p> : (
            <>
              <p className="mt-1 text-sm text-muted">Add Kaasu to your home screen. It opens like an app and works offline.</p>
              <Button className="mt-3" onClick={async () => { await install?.prompt(); const c = await install?.userChoice; if (c?.outcome === "accepted") toast("Installing Kaasu"); setInstall(null); }}><Smartphone aria-hidden />Install Kaasu</Button>
            </>
          )}
        </Card>
      )}

      <Card aria-labelledby="s-sample">
        <h2 id="s-sample" className="text-lg font-bold">Sample data</h2>
        <p className="mt-1 text-sm text-muted">Made-up entries to try Kaasu out. Every sample line is marked &quot;sample&quot;. Budgets it adds stay until you change them.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {hasSample
            ? <Button variant="outline" onClick={() => { removeSample(); toast("Sample data removed"); }}>Remove sample data</Button>
            : <Button variant="outline" onClick={() => { loadSample(); toast("Sample data loaded"); }}><Sparkles aria-hidden />Load sample data</Button>}
        </div>
      </Card>

      <Card aria-labelledby="s-erase" className="border-danger/40">
        <h2 id="s-erase" className="text-lg font-bold text-danger">Erase everything</h2>
        <p className="mt-1 text-sm text-muted">Deletes all entries, budgets, recurring rules and goals from this device. Save a backup first. Type <b>ERASE</b> to confirm.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor="erase" className="sr-only">Type ERASE to confirm</label>
          <input id="erase" value={eraseText} onChange={(e) => setEraseText(e.target.value)} autoComplete="off" className={`${inputClass} h-11 max-w-40`} placeholder="ERASE" />
          <Button variant="danger" disabled={eraseText !== "ERASE"} onClick={() => { eraseAll(); setEraseText(""); setReport(null); toast("All data erased"); }}><Trash2 aria-hidden />Erase all data</Button>
        </div>
      </Card>

      <p className="flex items-start gap-2 px-1 text-xs text-muted"><ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />Kaasu has no account, no server and no trackers. Nothing you type leaves this device unless you export it.</p>
    </div>
  );
}
