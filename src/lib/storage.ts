/**
 * Storage that never throws. Private-mode browsers, blocked cookies, and
 * non-browser renderers can all make `localStorage` unavailable — the shop
 * must keep working in-memory instead of crashing to a blank page.
 */

export function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — app continues in-memory */
  }
}

export function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
