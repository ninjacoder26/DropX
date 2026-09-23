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

// Auth sessions die on return visits when localStorage is blocked
// (private mode, disabled cookies): the login never gets stored.
// Memory fallback keeps the session for the tab lifetime instead.
export function createSafeStorage(): {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
} {
  const mem = new Map<string, string>();
  return {
    getItem(key: string): string | null {
      try {
        return localStorage.getItem(key) ?? mem.get(key) ?? null;
      } catch {
        return mem.get(key) ?? null;
      }
    },
    setItem(key: string, value: string): void {
      try {
        localStorage.setItem(key, value);
      } catch {
        mem.set(key, value);
      }
    },
    removeItem(key: string): void {
      mem.delete(key);
      try {
        localStorage.removeItem(key);
      } catch {
        /* memory already cleared */
      }
    },
  };
}
