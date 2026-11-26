import { dataSchema } from "./schema";
import { EMPTY_DATA, type AppData } from "./types";

export const STORAGE_KEY = "kaasu:data:v1";
export const CORRUPT_KEY = "kaasu:data:corrupt";

export type LoadResult =
  | { status: "ok"; data: AppData }
  | { status: "empty"; data: AppData }
  | { status: "recovered"; data: AppData; reason: string }
  | { status: "unavailable"; data: AppData; reason: string };

/** Read and validate saved data. Never throws; corrupt data is set aside, not deleted. */
export function loadData(storage: Storage | undefined = safeStorage()): LoadResult {
  if (!storage) return { status: "unavailable", data: EMPTY_DATA, reason: "This browser is blocking storage, so nothing can be saved." };
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { status: "unavailable", data: EMPTY_DATA, reason: "This browser is blocking storage, so nothing can be saved." };
  }
  if (!raw) return { status: "empty", data: EMPTY_DATA };
  try {
    const parsed = dataSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return { status: "ok", data: parsed.data as AppData };
    storage.setItem(CORRUPT_KEY, raw);
    return { status: "recovered", data: EMPTY_DATA, reason: "Saved data failed a safety check. A copy was set aside and the app started fresh." };
  } catch {
    try { storage.setItem(CORRUPT_KEY, raw); } catch { /* ignore */ }
    return { status: "recovered", data: EMPTY_DATA, reason: "Saved data could not be read. A copy was set aside and the app started fresh." };
  }
}

export type SaveResult = { ok: true } | { ok: false; error: string };

export function saveData(data: AppData, storage: Storage | undefined = safeStorage()): SaveResult {
  if (!storage) return { ok: false, error: "Storage is blocked in this browser." };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't save. Your device storage may be full. Export a backup now." };
  }
}

function safeStorage(): Storage | undefined {
  try {
    if (typeof window === "undefined") return undefined;
    const s = window.localStorage;
    const k = "kaasu:probe";
    s.setItem(k, "1");
    s.removeItem(k);
    return s;
  } catch {
    return undefined;
  }
}
