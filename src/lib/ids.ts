export function newId(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID().replace(/-/g, "").slice(0, 20);
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
