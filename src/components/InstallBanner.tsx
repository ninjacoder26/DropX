import { useEffect, useRef, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { safeGet, safeSet } from '../lib/storage';

const SEEN_KEY = 'dropx-pwa-seen';
const SHOW_MS = 30_000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Gentle PWA install nudge: slim top bar, first open only, auto-dismisses
 * after 30s, never modal, never re-shows once dismissed.
 */
export function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<'prompt' | 'ios'>('prompt');
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (safeGet<string | null>(SEEN_KEY, null)) return;
    const standalone =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(display-mode: standalone)').matches;
    if (standalone) {
      safeSet(SEEN_KEY, 'installed');
      return;
    }
    const isIOS =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS) {
      setMode('ios');
      setVisible(true);
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferred.current = e as BeforeInstallPromptEvent;
      setMode('prompt');
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    timer.current = setTimeout(() => dismiss(), SHOW_MS);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismiss() {
    safeSet(SEEN_KEY, '1');
    setVisible(false);
    if (timer.current) clearTimeout(timer.current);
  }

  async function install() {
    try {
      await deferred.current?.prompt();
    } catch {
      /* browser handles the dialog */
    } finally {
      dismiss();
    }
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Install DropX app"
      className="install-banner fixed inset-x-0 top-0 z-50 border-b border-ink/10 bg-ink text-paper"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 sm:px-6">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ember font-display text-xs font-black text-white">
          DX
        </span>
        <p className="min-w-0 flex-1 truncate text-xs font-semibold">
          {mode === 'prompt' ? (
            <>Install DropX for faster shopping<span className="hidden sm:inline"> — works offline, opens full-screen</span>.</>
          ) : (
            <span className="flex items-center gap-1">
              Add DropX to Home Screen <Share size={12} /> via Share — faster shopping, full-screen.
            </span>
          )}
        </p>
        {mode === 'prompt' && (
          <button
            onClick={install}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-ember px-4 py-1.5 text-xs font-bold text-white transition hover:bg-ember-dark"
          >
            <Download size={13} /> Install
          </button>
        )}
        <button onClick={dismiss} aria-label="Dismiss install banner" className="shrink-0 rounded-full p-1.5 text-paper/60 transition hover:bg-paper/10 hover:text-paper">
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
