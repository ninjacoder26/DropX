import { useEffect, useRef, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { safeGet, safeSet } from '../lib/storage';

const SEEN_KEY = 'dropx-pwa-seen';
const SHOW_DELAY_MS = 2_500;
const SHOW_MS = 30_000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Gentle PWA install nudge: slim top bar, first open only, appears ~2.5s
 * after load (never fighting first paint), auto-dismisses after 30s,
 * never modal, never re-shows once dismissed.
 */
export function InstallBanner() {
  const [seen] = useState(() => safeGet<string | null>(SEEN_KEY, null));
  const [signal, setSignal] = useState<'prompt' | 'ios' | null>(null);
  const [visible, setVisible] = useState(false);
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);

  // Subscribe once: real install prompt, or iOS manual-add hint.
  useEffect(() => {
    if (seen) return;
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
    if (isIOS) setSignal('ios');
    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferred.current = e as BeforeInstallPromptEvent;
      setSignal('prompt');
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, [seen]);

  // Delayed, non-distracting reveal after the page has settled.
  useEffect(() => {
    if (!signal || seen) return;
    const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [signal, seen]);

  // Auto-dismiss 30s after appearing.
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => dismiss(), SHOW_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible ]);

  function dismiss() {
    safeSet(SEEN_KEY, '1');
    setVisible(false);
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
  const ios = signal === 'ios';

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
          {ios ? (
            <span className="flex items-center gap-1">
              Add DropX to Home Screen <Share size={12} /> via Share — faster shopping, full-screen.
            </span>
          ) : (
            <>Install DropX for faster shopping<span className="hidden sm:inline"> — works offline, opens full-screen</span>.</>
          )}
        </p>
        {!ios && (
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
