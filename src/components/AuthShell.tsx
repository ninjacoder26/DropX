import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * Shared shell for every auth screen: roomy card, thumb-sized controls,
 * brand panel on desktop. Keeps login/register/staff/recovery consistent
 * instead of five hand-rolled narrow columns.
 */
export function AuthShell({
  kicker,
  title,
  sub,
  children,
}: {
  kicker: string;
  title: string;
  sub: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="grid overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-ink/5 lg:grid-cols-[1fr_1.15fr]">
        <div className="texture-ink relative hidden flex-col justify-between gap-10 bg-ink p-8 text-paper lg:flex">
          <Link to="/" className="flex items-center gap-2" aria-label="DropX home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ember font-display text-sm font-black text-white">
              DX
            </span>
            <span className="font-display text-lg font-black">
              Drop<span className="text-ember">X</span>
            </span>
          </Link>
          <div>
            <p className="font-display text-3xl font-black leading-tight">
              Wear the drop.
              <br />
              Track every order.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-paper/70">
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ember text-[11px] font-black text-white">✓</span>
                Cash on Delivery across the Valley
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ember text-[11px] font-black text-white">✓</span>
                Monthly drops + Mega Drop of the Year
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ember text-[11px] font-black text-white">✓</span>
                Live order tracking, 7-day exchanges
              </li>
            </ul>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-paper/40">
            Kathmandu · Lalitpur · Bhaktapur
          </p>
        </div>
        <div className="p-6 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ember">{kicker}</p>
          <h1 className="mt-1 font-display text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
          <div className="mt-1 text-sm text-ink/60">{sub}</div>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
