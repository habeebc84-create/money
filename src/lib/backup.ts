import { dataSchema } from "./schema";
import type { AppData } from "./types";

export const BACKUP_APP = "kaasu";
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

export function makeBackup(data: AppData, now = new Date()): string {
  return JSON.stringify({ app: BACKUP_APP, exportedAt: now.toISOString(), data }, null, 2);
}

export type RestoreResult = { ok: true; data: AppData } | { ok: false; error: string };

export function readBackup(text: string): RestoreResult {
  if (text.length > MAX_BACKUP_BYTES) return { ok: false, error: "Backup file is larger than 5 MB." };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "This isn't a valid JSON file." };
  }
  if (!raw || typeof raw !== "object" || (raw as { app?: unknown }).app !== BACKUP_APP) {
    return { ok: false, error: "This file isn't a Kaasu backup." };
  }
  const parsed = dataSchema.safeParse((raw as { data?: unknown }).data);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: `Backup failed a safety check (${first?.path.join(".") || "data"}: ${first?.message}). Nothing was changed.` };
  }
  return { ok: true, data: parsed.data as AppData };
}
