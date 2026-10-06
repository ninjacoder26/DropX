import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check, Eye, Package, Pause, ShoppingBag, Wallet, X } from 'lucide-react';
import { useStoreSettings } from '../lib/settings';
import { isCommercePaused } from '../lib/commerce';
import { usePageTitle } from '../hooks/usePageTitle';

const STATUS_ROWS = [
  { icon: Eye, label: 'Browsing', state: 'Open — look around freely', open: true },
  { icon: ShoppingBag, label: 'Checkout', state: 'Disabled for now', open: false },
  { icon: Package, label: 'Orders', state: 'Paused — nothing new goes out', open: false },
  { icon: Wallet, label: 'Payments', state: 'Disabled for now', open: false },
];

/**
 * DropX Commerce Pause — a deliberate system state, not a crash page.
 * DropX has intentionally paused commercial operations while its e-commerce
 * registration and compliance requirements are completed. Browsing stays
 * open; buying waits until further notice.
 */
export function PausePage() {
  usePageTitle('Paused — back soon');
  return (
    <div className="texture-ink relative flex min-h-screen flex-col overflow-hidden bg-ink text-paper">
      <div className="relative z-[2] overflow-hidden border-b border-paper/10 py-2" aria-hidden>
        <div className="marquee flex gap-8 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.3em] text-paper/40">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="flex items-center gap-8">
              Paused — until further notice <span className="text-ember">✦</span> Not gone, just on hold{' '}
              <span className="text-ember">✦</span>
            </span>
          ))}
        </div>
      </div>

      <div className="relative z-[2] mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-14 text-center sm:px-6">
        <p className="reveal text-[11px] font-bold uppercase tracking-[0.25em] text-paper/50">
          DropX / Commerce status
        </p>
        <p className="reveal reveal-1 mt-4 inline-flex items-center gap-2 rounded-full border border-ember/50 bg-ember/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em]">
          <span className="pause-dot" aria-hidden />
          Paused — until further notice
        </p>

        <h1 className="reveal reveal-1 mt-6 font-display text-5xl font-black leading-[1.0] tracking-tight sm:text-7xl">
          DROPX
          <br />
          IS <span className="text-ember">PAUSED.</span>
        </h1>
        <p className="reveal reveal-2 mt-3 font-accent text-2xl text-paper/85 sm:text-3xl">
          Not gone. Just on hold.
        </p>
        <p className="reveal reveal-2 mt-5 max-w-md text-[15px] leading-relaxed text-paper/70">
          We have temporarily paused DropX&apos;s commercial operations while we complete the required
          e-commerce registration and compliance process in Nepal. Until that is complete, orders and
          payments are taking a little break.
        </p>
        <p className="reveal reveal-2 mt-3 text-sm font-bold text-paper/60">
          The drops are taking a breather.
        </p>

        <dl className="reveal reveal-3 mt-8 grid w-full max-w-md grid-cols-1 gap-2 text-left sm:grid-cols-2">
          {STATUS_ROWS.map((r) => (
            <div
              key={r.label}
              className="flex items-center gap-3 rounded-2xl border border-paper/10 bg-paper/5 px-4 py-3"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  r.open ? 'bg-ember text-white' : 'bg-paper/10 text-paper/50'
                }`}
              >
                <r.icon size={17} />
              </span>
              <span className="min-w-0">
                <dt className="text-sm font-bold">{r.label}</dt>
                <dd className="flex items-center gap-1 text-xs text-paper/60">
                  {r.open ? <Check size={11} className="text-ember" /> : <X size={11} />}
                  {r.state}
                </dd>
              </span>
            </div>
          ))}
        </dl>

        <div className="reveal reveal-3 mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-ember px-7 py-3 text-sm font-bold text-white transition hover:bg-ember-dark"
          >
            <Eye size={15} /> Keep browsing
          </Link>
          <a
            href="mailto:dropx.nepal@gmail.com"
            className="inline-flex items-center gap-2 rounded-full border border-paper/25 px-7 py-3 text-sm font-bold text-paper/80 transition hover:border-paper/60 hover:text-paper"
          >
            Talk to us
          </a>
        </div>

        <p className="mt-8 max-w-md text-[11px] leading-relaxed text-paper/40">
          Operating under the compliance requirements of Nepal&apos;s Electronic Commerce (E-Commerce)
          Act, 2081. DropX will resume commercial operations once the required requirements have been
          completed — until further notice, the shelves stay visible but the till stays shut.
        </p>
      </div>

      <div className="relative z-[2] flex items-center justify-center gap-2 border-t border-paper/10 py-3 text-[10px] font-bold uppercase tracking-[0.3em] text-paper/40">
        <Pause size={11} className="text-ember" /> Commerce paused · Browsing open
      </div>
    </div>
  );
}

/** Slim warning above the storefront while paused: view, don't buy. */
function PauseBanner() {
  return (
    <div className="bg-ember px-4 py-1.5 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-white">
      Service paused — browse freely, ordering resumes soon.{' '}
      <Link to="/pause" className="underline underline-offset-2">
        Why?
      </Link>
    </div>
  );
}

/**
 * Commerce gate: browsing always passes; a slim banner warns that service
 * is closed. No roles, no bypasses, no countdowns — team and visitors see
 * the same storefront. Admin/staff shells skip the banner.
 */
export function CommerceGate({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const settings = useStoreSettings();
  if (pathname.startsWith('/admin') || pathname.startsWith('/staff')) {
    return <>{children}</>;
  }
  return (
    <>
      {isCommercePaused(settings) && <PauseBanner />}
      {children}
    </>
  );
}
