import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cachedFetch, createTTLCache, onSlowData } from '../src/lib/cache';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(1_000_000);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ttl cache', () => {
  it('serves hits until expiry, then reloads', async () => {
    const cache = createTTLCache<string>(60_000);
    let calls = 0;
    const loader = async () => `v${++calls}`;
    expect(await cachedFetch(cache, 'k', loader)).toBe('v1');
    expect(await cachedFetch(cache, 'k', loader)).toBe('v1');
    expect(calls).toBe(1);
    vi.advanceTimersByTime(60_001);
    expect(await cachedFetch(cache, 'k', loader)).toBe('v2');
    expect(calls).toBe(2);
  });

  it('never caches failures', async () => {
    const cache = createTTLCache<string>(60_000);
    let calls = 0;
    await expect(
      cachedFetch(cache, 'k', async () => {
        calls++;
        throw new Error('nope');
      })
    ).rejects.toThrow('nope');
    await expect(cachedFetch(cache, 'k', async () => 'ok')).resolves.toBe('ok');
    expect(calls).toBe(1);
  });

  it('clear() forces a reload', async () => {
    const cache = createTTLCache<number>(60_000);
    let calls = 0;
    const loader = async () => ++calls;
    await cachedFetch(cache, 'k', loader);
    cache.clear();
    await cachedFetch(cache, 'k', loader);
    expect(calls).toBe(2);
  });

  it('notifies slow listeners when a load hangs past 5s, then clears', async () => {
    const cache = createTTLCache<string>(60_000);
    const states: boolean[] = [];
    const unsub = onSlowData((s) => states.push(s));
    try {
      let resolve!: (v: string) => void;
      const p = cachedFetch(
        cache,
        'k',
        () =>
          new Promise<string>((r) => {
            resolve = r;
          })
      );
      expect(states).toEqual([]);
      await vi.advanceTimersByTimeAsync(4999);
      expect(states).toEqual([]);
      await vi.advanceTimersByTimeAsync(1);
      expect(states).toEqual([true]);
      resolve('v');
      await expect(p).resolves.toBe('v');
      expect(states).toEqual([true, false]);
    } finally {
      unsub();
    }
  });

  it('stays quiet without listeners and on fast loads', async () => {
    const cache = createTTLCache<string>(60_000);
    await cachedFetch(cache, 'k', async () => 'v');
    await vi.advanceTimersByTimeAsync(30_000);
    const states: boolean[] = [];
    const unsub = onSlowData((s) => states.push(s));
    try {
      await cachedFetch(cache, 'k', async () => 'v2');
      await vi.advanceTimersByTimeAsync(30_000);
      expect(states).toEqual([]);
    } finally {
      unsub();
    }
  });
});
