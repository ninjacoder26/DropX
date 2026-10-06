import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Eye, Mail, Package, Pause, ShoppingBag, Wallet, X } from 'lucide-react';
import { useStoreSettings } from '../lib/settings';
import { isCommercePaused } from '../lib/commerce';
import { usePageTitle } from '../hooks/usePageTitle';

const ACT_URL = 'https://lawcommission.gov.np/content/13517/electricity-trade--e-workers--act--2081';

const STATUS_ROWS = [
  { icon: Eye, label: 'Browsing', state: 'Back when we reopen', open: false },
  { icon: ShoppingBag, label: 'Checkout', state: 'Disabled for now', open: false },
  { icon: Package, label: 'Orders', state: 'Paused — nothing new goes out', open: false },
  { icon: Wallet, label: 'Payments', state: 'Disabled for now', open: false },
];

const FAQ = [
  {
    q: 'Can I still look around?',
    a: 'Yes — product pages, drops and collections stay visible. Only checkout, ordering and payments are paused.',
  },
  {
    q: 'What happens to my bag and wishlist?',
    a: 'Saved exactly as they are. When checkout reopens, everything is where you left it.',
  },
  {
    q: 'Is my account and data safe?',
    a: 'Yes. Nothing is deleted early, and cancelled or delivered orders auto-delete after 7 days as always.',
    link: { to: '/privacy', label: 'Read the Privacy Policy' },
  },
  {
    q: 'When will DropX reopen?',
    a: 'There is no fixed date — this page stays up until further notice, and checkout returns on its own once registration and compliance allow it.',
  },
];

/**
 * DropX Commerce Pause — a deliberate system state, not a crash page.
 * DropX is currently unable to trade while its e-commerce registration and
 * compliance requirements are completed. Browsing returns with reopening;
 * until then the pause page is the whole storefront.
 */
export function PausePage() {
  usePageTitle('Paused — back soon');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const glowRef = useRef<HTMLDivElement>(null);
  const finePointer = useMemo(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: fine)').matches,
    []
  );
  return (
    <div
      className="texture-ink relative flex min-h-screen flex-col overflow-hidden bg-ink text-paper"
      onMouseMove={(e) => {
        const el = glowRef.current;
        if (!el) return;
        const r = e.currentTarget.getBoundingClientRect();
        el.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px)`;
      }}
    >
      {finePointer && (
        <div ref={glowRef} aria-hidden className="pointer-events-none absolute left-0 top-0 z-[1] h-0 w-0">
          <div className="-translate-x-1/2 -translate-y-1/2 rounded-full bg-ember/10 blur-3xl" style={{ width: 480, height: 480 }} />
        </div>
      )}
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

      <div className="relative z-[2] mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-5 py-12 sm:px-10 sm:py-16">
        <p className="reveal text-[11px] font-bold uppercase tracking-[0.25em] text-paper/50">
          DropX / Commerce status
        </p>
        <p className="reveal reveal-1 mt-4 inline-flex items-center gap-2 rounded-full border border-ember/50 bg-ember/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em]">
          <span className="pause-dot" aria-hidden />
          Paused — until further notice
        </p>
        <p className="reveal reveal-1 mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-paper/35">
          Status last reviewed October 2026
        </p>

        <h1 className="reveal reveal-1 mt-6 text-center font-display font-black leading-[1.0] tracking-tight text-[clamp(2.75rem,12vw,6rem)] sm:text-7xl lg:text-8xl">
          DROPX IS <span className="text-ember">PAUSED.</span>
        </h1>
        <p className="reveal reveal-2 mt-3 text-center font-accent text-2xl text-paper/85 sm:text-3xl">
          Not gone. Just on hold.
        </p>
        <p className="reveal reveal-2 mx-auto mt-5 max-w-2xl text-center text-[15px] leading-relaxed text-paper/70 sm:text-base">
          DropX is currently <strong className="text-paper">unable to take orders or accept
          payments</strong>. We are <strong className="text-paper">unable to resume</strong> due to
          required e-commerce registration and compliance process in Nepal, for now.
        </p>
        <p className="reveal reveal-2 mt-3 text-center text-sm font-bold text-paper/60">
          The drops are taking a breather.
        </p>
        <p className="reveal reveal-2 mx-auto mt-2 max-w-xl text-center text-[13px] leading-relaxed text-paper/55">
          We sincerely apologize for this interruption and any inconvenience it causes you.
          Thank you for your patience and understanding.
        </p>

        <div className="reveal reveal-2 mt-8 grid w-full gap-3 text-left sm:grid-cols-2">
          <div className="rounded-2xl border border-paper/10 bg-paper/5 p-5 transition-colors hover:border-paper/25 sm:p-6">
            <p className="flex items-baseline gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-ember">
              <span aria-hidden className="font-display text-sm">01</span> Why is ordering restricted?
            </p>
            <p className="mt-2 text-sm leading-relaxed text-paper/75">
              Nepal&apos;s{' '}
              <a
                href={ACT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-paper underline decoration-ember decoration-2 underline-offset-2 hover:text-ember"
              >
                Electronic Commerce (E-Commerce) Act, 2081
              </a>{' '}
              requires online sellers to complete e-commerce registration and related compliance
              first. We are <strong className="text-paper">unable to take orders or payments for
              now</strong> — no shortcuts, no exceptions.
            </p>
          </div>

          <div className="rounded-2xl border border-paper/10 bg-paper/5 p-5 transition-colors hover:border-paper/25 sm:p-6">
            <p className="flex items-baseline gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-ember">
              <span aria-hidden className="font-display text-sm">02</span> When do we reopen?
            </p>
            <p className="mt-2 text-sm leading-relaxed text-paper/75">
              There is no fixed date — this page stays up{' '}
              <strong className="text-paper">until further notice</strong>. We are{' '}
              <strong className="text-paper">unable to reopen</strong> until registration and
              compliance allow it — when that happens, checkout returns on its own.
              We sincerely appreciate your patience. Nothing you need to do
              except check back. Questions?{' '}
              <a
                href="mailto:dropx.nepal@gmail.com"
                className="font-bold text-paper underline decoration-ember decoration-2 underline-offset-2 hover:text-ember"
              >
                dropx.nepal@gmail.com
              </a>
            </p>
          </div>
        </div>

        <dl className="reveal reveal-3 mt-3 grid w-full gap-3 text-left sm:grid-cols-2 lg:grid-cols-4">
          {STATUS_ROWS.map((r) => (
            <div
              key={r.label}
              className="flex items-center gap-3 rounded-2xl border border-paper/10 bg-paper/5 px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:border-paper/25"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-paper/10 text-paper/50">
                <r.icon size={17} />
              </span>
              <span className="min-w-0">
                <dt className="text-sm font-bold">{r.label}</dt>
                <dd className="flex items-center gap-1 text-xs text-paper/60">
                  <X size={11} />
                  {r.state}
                </dd>
              </span>
            </div>
          ))}
        </dl>

        <div className="reveal reveal-3 mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <a
            href="mailto:dropx.nepal@gmail.com"
            className="inline-flex items-center gap-2 rounded-full bg-ember px-7 py-3 text-sm font-bold text-white transition hover:bg-ember-dark active:scale-[0.98]"
          >
            <Mail size={15} /> Talk to us
          </a>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-paper/40">
            Check back soon
          </span>
        </div>

        <div className="reveal reveal-3 mt-10 w-full max-w-2xl text-left">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.25em] text-paper/40">
            Quick answers
          </p>
          <ul className="mt-4 space-y-2">
            {FAQ.map((f, i) => {
              const open = openFaq === i;
              return (
                <li key={f.q} className="overflow-hidden rounded-2xl border border-paper/10 bg-paper/5 transition-colors hover:border-paper/25">
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left"
                  >
                    <span className="min-w-0 flex-1 text-sm font-bold">{f.q}</span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-ember transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-4 text-sm leading-relaxed text-paper/65">
                        {f.a}{' '}
                        {f.link && (
                          <Link to={f.link.to} className="font-bold text-paper underline decoration-ember decoration-2 underline-offset-2 hover:text-ember">
                            {f.link.label}
                          </Link>
                        )}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-center text-[11px] leading-relaxed text-paper/40">
          Operating under the compliance requirements of Nepal&apos;s{' '}
          <a
            href={ACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-paper/70"
          >
            Electronic Commerce (E-Commerce) Act, 2081
          </a>
          . DropX remains unable to resume until registration and compliance requirements have been
          completed — until further notice, the shelves stay visible but the till stays shut.
        </p>
      </div>

      <div className="relative z-[2] flex items-center justify-center gap-2 border-t border-paper/10 py-3 text-[10px] font-bold uppercase tracking-[0.3em] text-paper/40">
        <Pause size={11} className="text-ember" /> Commerce paused · Browsing open
      </div>
    </div>
  );
}

/**
 * Commerce gate: while paused, every storefront route IS the pause page —
 * full-bleed, no navbar, no footer, no exceptions for anyone. Admin/staff
 * shells keep working so the shop can be run and reopened.
 */
export function CommerceGate({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const settings = useStoreSettings();
  if (pathname.startsWith('/admin') || pathname.startsWith('/staff')) {
    return <>{children}</>;
  }
  if (isCommercePaused(settings)) {
    return <PausePage />;
  }
  return <>{children}</>;
}
