import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dropAdminList, getAdminList, setAdminList } from '../src/lib/admin';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(1_000_000);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('admin list cache', () => {
  it('serves rows until the 45s window lapses', () => {
    expect(getAdminList('products')).toBeNull();
    setAdminList('products', [{ id: 'p1' }]);
    expect(getAdminList<{ id: string }[]>('products')).toEqual([{ id: 'p1' }]);
    vi.advanceTimersByTime(44_999);
    expect(getAdminList('products')).not.toBeNull();
    vi.advanceTimersByTime(2);
    expect(getAdminList('products')).toBeNull();
  });

  it('keys independently and drops on demand', () => {
    setAdminList('a', [1]);
    setAdminList('b', [2]);
    dropAdminList('a');
    expect(getAdminList('a')).toBeNull();
    expect(getAdminList<number[]>('b')).toEqual([2]);
  });
});
