import { useEffect, useReducer } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const subs = new Set<() => void>();
let listening = false;

function ensureListener() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    subs.forEach((s) => s());
  });
}

export function isStandalone(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches
  );
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/**
 * Shared install state: the banner owns the one-time nudge, this hook
 * powers always-available entry points (e.g. the account page card).
 */
export function usePwaInstall() {
  const [, bump] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    ensureListener();
    const f = () => bump();
    subs.add(f);
    return () => {
      subs.delete(f);
    };
  }, []);
  const standalone = isStandalone();
  return {
    canInstall: deferred !== null && !standalone,
    showIOSHint: !standalone && isIOS() && deferred === null,
    isStandalone: standalone,
    install: async () => {
      try {
        await deferred?.prompt();
      } finally {
        deferred = null;
        subs.forEach((s) => s());
      }
    },
  };
}
