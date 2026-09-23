import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * Full-page auth shell: edge-to-edge split screen — brand stage on one
 * side, roomy form column on the other. No more tiny centered box.
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
    <div className="w-full">
      <div className="grid min-h-[calc(100dvh-65px)] lg:grid-cols-[1.05fr_1fr]">
        {/* Brand stage */}
        <div className="texture-ink relative flex flex-col justify-between gap-8 overflow-hidden bg-ink px-6 py-8 text-paper sm:px-10 lg:p-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-10 -right-6 select-none font-display text-[11rem] font-black leading-none text-paper/[0.06] sm:text-[16rem]"
          >
            DX
          </div>
          <div className="relative flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2" aria-label="DropX home">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ember font-display text-sm font-black text-white">
                DX
              </span>
              <span className="font-display text-lg font-black">
                Drop<span className="text-ember">X</span>
              </span>
            </Link>
            <span className="rounded-full border border-paper/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-paper/60">
              Kathmandu Valley
            </span>
          </div>

          <div className="relative">
            <p className="font-display text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
              Wear the
              <br />
              <span className="text-ember">Drop.</span>
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-paper/65 sm:text-[15px]">
              Drops, tech and everyday goods — cash on delivery, tracked to your door.
            </p>
            <ul className="mt-6 hidden gap-5 text-sm text-paper/75 sm:flex lg:flex-col lg:gap-3">
              <li className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ember text-xs font-black text-white">✓</span>
                Cash on Delivery, no advance
              </li>
              <li className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ember text-xs font-black text-white">✓</span>
                Monthly drops + Mega Drop of the Year
              </li>
              <li className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ember text-xs font-black text-white">✓</span>
                Live tracking, 7-day exchanges
              </li>
            </ul>
          </div>

          <div className="relative flex items-center gap-5 text-[11px] font-bold uppercase tracking-[0.2em] text-paper/40">
            <span>COD</span>
            <span className="h-3 w-px bg-paper/20" />
            <span>1–3 day delivery</span>
            <span className="h-3 w-px bg-paper/20" />
            <span>58 areas</span>
          </div>
        </div>

        {/* Form side */}
        <div className="flex items-center justify-center bg-paper px-4 py-10 sm:px-8 sm:py-12 lg:py-14">
          <div className="w-full max-w-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ember">{kicker}</p>
            <h1 className="mt-2 font-display text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
            <div className="mt-2 text-[15px] text-ink/60">{sub}</div>
            <div className="mt-7">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
