import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Construction } from 'lucide-react';
import { useStoreSettings, type StoreSettings } from '../lib/settings';
import {
  hasMaintenanceBypass,
  isMaintenanceMode,
  setMaintenanceBypass,
} from '../lib/maintenance';

const FALLBACK_COUNTDOWN = 6;

/** Lightweight ember/paper particle drift. Skipped entirely for reduced motion. */
function Particles() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, w * dpr);
      canvas.height = Math.max(1, h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    const dots = Array.from({ length: 70 }, () => ({
      fx: Math.random(),
      fy: Math.random(),
      ox: 0,
      oy: 0,
      vx: (Math.random() - 0.5) * 0.0006,
      vy: (Math.random() - 0.5) * 0.0006,
      r: 1 + Math.random() * 2.4,
      c: Math.random() < 0.32 ? '240,100,39' : '247,245,240',
      a: 0.12 + Math.random() * 0.45,
    }));
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (document.hidden || w === 0) return;
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        d.ox = (d.ox + d.vx + 1) % 1;
        d.oy = (d.oy + d.vy + 1) % 1;
        ctx.beginPath();
        ctx.arc(((d.fx + d.ox) % 1) * w, ((d.fy + d.oy) % 1) * h, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${d.c},${d.a})`;
        ctx.fill();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

function CountdownRing({ remaining, total }: { remaining: number; total: number }) {
  const R = 26;
  const C = 2 * Math.PI * R;
  const progress = remaining / total;
  return (
    <span className="relative flex h-16 w-16 items-center justify-center" aria-hidden="true">
      <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx={32} cy={32} r={R} fill="none" strokeWidth={5} className="stroke-paper/15" />
        <circle
          cx={32}
          cy={32}
          r={R}
          fill="none"
          strokeWidth={5}
          strokeLinecap="round"
          className="stroke-ember transition-[stroke-dashoffset] duration-200"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - progress)}
        />
      </svg>
      <span className="font-display text-xl font-black tabular-nums">
        {remaining}
      </span>
    </span>
  );
}

export type MaintenanceCopy = Pick<
  StoreSettings,
  | 'maintenanceTitle' | 'maintenanceMessage' | 'maintenanceButton'
  | 'maintenanceCountdown' | 'maintenanceParticles' | 'maintenanceContact'
  | 'supportEmail'
>;

export function MaintenancePage({ onContinue, overrides }: { onContinue?: () => void; overrides?: Partial<MaintenanceCopy> }) {
  // Everything except brand/theme comes from Admin → Settings (with the
  // same defaults as a fresh install, so the page works offline too).
  // `overrides` exists for previews/tests; production always uses settings.
  const settings = useStoreSettings();
  const s: MaintenanceCopy & { supportEmail: string } = {
    maintenanceTitle: settings.maintenanceTitle,
    maintenanceMessage: settings.maintenanceMessage,
    maintenanceButton: settings.maintenanceButton,
    maintenanceCountdown: settings.maintenanceCountdown,
    maintenanceParticles: settings.maintenanceParticles,
    maintenanceContact: settings.maintenanceContact,
    supportEmail: settings.supportEmail,
    ...overrides,
  };
  const total = Math.min(60, Math.max(0, Math.round(s.maintenanceCountdown ?? FALLBACK_COUNTDOWN)));
  const title = s.maintenanceTitle || '';
  const message =
    s.maintenanceMessage ||
    'DropX is getting a quick tune-up — new heat, fresh fixes, better everything. We\u2019ll be back to full volume in a few minutes.';
  const buttonLabel = s.maintenanceButton || 'Continue Anyway';
  const { supportEmail } = settings;
  const [remaining, setRemaining] = useState(total);

  useEffect(() => {
    setRemaining(total);
    if (total <= 0) return;
    const start = Date.now();
    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((total * 1000 - (Date.now() - start)) / 1000));
      setRemaining((prev) => (prev === left ? prev : left));
    }, 200);
    return () => clearInterval(timer);
  }, [total]);

  const ready = remaining <= 0;

  return (
    <div className="texture-ink relative flex min-h-screen flex-col overflow-hidden bg-ink text-paper">
      {s.maintenanceParticles && <Particles />}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-ember/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-ember/10 blur-3xl"
      />

      <div className="relative z-[2] mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <p className="reveal inline-flex items-center gap-2 rounded-full border border-paper/20 bg-paper/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-paper/80">
          <Construction size={14} className="text-ember" />
          Under maintenance
        </p>
        <h1 className="reveal reveal-1 mt-6 font-display text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl">
          {title ? (
            <span className="whitespace-pre-line">{title}</span>
          ) : (
            <>
              We&rsquo;re tuning
              <br />
              the <span className="font-accent font-normal tracking-normal text-ember">Drop.</span>
            </>
          )}
        </h1>
        <p className="reveal reveal-2 mt-5 max-w-md whitespace-pre-line text-[15px] leading-relaxed text-paper/70">
          {message}
        </p>

        <div className="reveal reveal-3 mt-8 flex flex-col items-center gap-4">
          <CountdownRing remaining={remaining} total={Math.max(total, 1)} />
          <p className="sr-only" role="status">
            {ready ? 'You may continue to the site.' : `Continue available in ${remaining} seconds.`}
          </p>
          <button
            onClick={() => {
              if (!ready) return;
              setMaintenanceBypass();
              onContinue?.();
            }}
            disabled={!ready}
            className={`shadow-sticker inline-flex items-center gap-2 rounded-full border-2 px-7 py-3.5 text-sm font-bold transition active:scale-[0.98] ${
              ready
                ? 'border-paper/80 bg-ember text-white hover:bg-ember-dark'
                : 'cursor-not-allowed border-paper/20 bg-paper/10 text-paper/50'
            }`}
          >
            {ready ? (
              <>{buttonLabel} <ArrowRight size={16} /></>
            ) : (
              <>{buttonLabel} ({remaining}s)</>
            )}
          </button>
          <p className="text-[11px] text-paper/40">
            Admins are never blocked — <Link to="/admin" className="font-bold text-paper/60 underline underline-offset-2 hover:text-paper">open dashboard</Link>
          </p>
        </div>
      </div>

      {s.maintenanceContact && (
        <p className="relative z-[2] px-4 pb-6 text-center text-[11px] text-paper/40">
          Questions? {s.supportEmail}
        </p>
      )}
    </div>
  );
}

/**
 * Blocks customer routes while maintenance is on. Admin routes and
 * opted-in sessions pass straight through — nothing else changes.
 *
 * Source of truth: the code flag (emergency) OR Admin → Settings.
 * Frequency 'once' remembers Continue for the browser session;
 * 'always' re-blocks on every fresh page load.
 */
export function MaintenanceGate({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const settings = useStoreSettings();
  const [passed, setPassed] = useState(false);

  const on = isMaintenanceMode() || settings.maintenanceEnabled;
  if (!on || pathname.startsWith('/admin')) {
    return <>{children}</>;
  }
  const bypassed =
    passed || (settings.maintenanceFrequency !== 'always' && hasMaintenanceBypass());
  if (bypassed) {
    return <>{children}</>;
  }
  return (
    <MaintenancePage
      onContinue={() => {
        setMaintenanceBypass();
        setPassed(true);
      }}
    />
  );
}
