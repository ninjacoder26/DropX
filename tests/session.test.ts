import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import { REFRESH_MARGIN_S, sessionNeedsRefresh } from '../src/lib/session';
import { createSafeStorage } from '../src/lib/storage';

const NOW = 1_700_000_000_000;

const sess = (expiresInS: number | null): Session =>
  ({
    access_token: 'tok',
    expires_at: expiresInS === null ? undefined : Math.floor(NOW / 1000) + expiresInS,
  }) as Session;

describe('sessionNeedsRefresh', () => {
  it('leaves null and tokenless sessions alone', () => {
    expect(sessionNeedsRefresh(null, NOW)).toBe(false);
    expect(sessionNeedsRefresh({} as Session, NOW)).toBe(false);
  });

  it('leaves fresh sessions alone', () => {
    expect(sessionNeedsRefresh(sess(3600), NOW)).toBe(false);
  });

  it('refreshes expired sessions and ones inside the margin', () => {
    expect(sessionNeedsRefresh(sess(-10), NOW)).toBe(true);
    expect(sessionNeedsRefresh(sess(REFRESH_MARGIN_S - 1), NOW)).toBe(true);
  });

  it('respects a custom margin', () => {
    expect(sessionNeedsRefresh(sess(120), NOW, 60)).toBe(false);
    expect(sessionNeedsRefresh(sess(30), NOW, 60)).toBe(true);
  });
});

describe('createSafeStorage', () => {
  // this jsdom setup ships without localStorage — stub a minimal one so the
  // adapter tests exercise the real branching, not the missing API.
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, String(v));
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      clear: () => store.clear(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('round-trips through localStorage when it works', () => {
    const s = createSafeStorage();
    s.setItem('k', 'v');
    expect(s.getItem('k')).toBe('v');
    expect(localStorage.getItem('k')).toBe('v');
    s.removeItem('k');
    expect(s.getItem('k')).toBeNull();
  });

  it('falls back to memory when localStorage writes are blocked', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const s = createSafeStorage();
    s.setItem('k', 'v');
    expect(s.getItem('k')).toBe('v');
    s.removeItem('k');
    expect(s.getItem('k')).toBeNull();
  });

  it('reads memory when localStorage reads throw', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const s = createSafeStorage();
    s.setItem('k', 'v');
    expect(s.getItem('k')).toBe('v');
  });
});
