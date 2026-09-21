import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, act } from '@testing-library/react';
import { InstallBanner } from '../src/components/InstallBanner';

const SEEN = 'dropx-pwa-seen';

function stubStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  });
}

beforeEach(() => {
  stubStorage();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('InstallBanner — gentle, once-ever, 30s max', () => {
  it('stays hidden when there is no install signal and not iOS', () => {
    Object.defineProperty(window.navigator, 'userAgent', { value: 'Mozilla/5.0 Desktop', configurable: true });
    render(<InstallBanner />);
    act(() => {
      vi.advanceTimersByTime(31_000);
    });
    expect(screen.queryByRole('region', { name: /install dropx/i })).toBeNull();
  });

  it('appears ~2.5s after the signal and auto-dismisses 30s later', () => {
    render(<InstallBanner />);
    act(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'));
    });
    // Delayed reveal: not instant, not fighting first paint.
    expect(screen.queryByRole('region', { name: /install dropx/i })).toBeNull();
    act(() => {
      vi.advanceTimersByTime(2_500);
    });
    expect(screen.getByRole('region', { name: /install dropx/i })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(screen.queryByRole('region', { name: /install dropx/i })).toBeNull();
    expect(localStorage.getItem(SEEN)).toBeTruthy();
  });

  it('never shows again once dismissed', () => {
    localStorage.setItem(SEEN, '1');
    render(<InstallBanner />);
    act(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'));
      vi.advanceTimersByTime(35_000);
    });
    expect(screen.queryByRole('region', { name: /install dropx/i })).toBeNull();
  });

  it('close button dismisses immediately and remembers', () => {
    render(<InstallBanner />);
    act(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'));
    });
    act(() => {
      vi.advanceTimersByTime(2_500);
    });
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(screen.queryByRole('region', { name: /install dropx/i })).toBeNull();
    expect(localStorage.getItem(SEEN)).toBeTruthy();
  });
});
