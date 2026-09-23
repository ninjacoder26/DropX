import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'dark' | 'ghost' | 'outline' | 'danger' }) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'border-2 border-ink bg-ember text-white shadow-sticker-sm hover:bg-ember-dark',
        variant === 'dark' && 'bg-ink text-paper hover:bg-ink-soft',
        variant === 'outline' && 'border border-ink/15 bg-white text-ink hover:border-ink/40',
        variant === 'ghost' && 'text-ink hover:bg-ink/5',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
        className
      )}
      {...props}
    />
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        'w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-ember focus:outline-none',
        props.className
      )}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink/60">{children}</label>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function Badge({ children, tone = 'ember' }: { children: ReactNode; tone?: 'ember' | 'ink' | 'paper' | 'green' | 'red' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide',
        tone === 'ember' && 'bg-ember text-white',
        tone === 'ink' && 'bg-ink text-paper',
        tone === 'paper' && 'bg-paper-dark text-ink',
        tone === 'green' && 'bg-green-100 text-green-800',
        tone === 'red' && 'bg-red-100 text-red-700'
      )}
    >
      {children}
    </span>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('rounded-2xl bg-white shadow-card ring-1 ring-ink/5', className)}>{children}</div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton rounded-xl', className)} />;
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white px-8 py-12 text-center shadow-card ring-1 ring-ink/5">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ember/10 text-xl font-black text-ember">
        DX
      </div>
      <h3 className="font-display text-lg font-extrabold">{title}</h3>
      <p className="mt-2 text-sm text-ink/60">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center">
      <p className="font-semibold text-red-800">Something went wrong</p>
      <p className="mt-1 text-sm text-red-700/80">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700">
          Try again
        </button>
      )}
    </div>
  );
}

export function PageHeader({ kicker, title, sub }: { kicker?: string; title: string; sub?: string }) {
  return (
    <div>
      {kicker && <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ember">{kicker}</p>}
      <h1 className="mt-1 font-display text-3xl font-black tracking-tight">{title}</h1>
      {sub && <p className="mt-1 max-w-2xl text-sm text-ink/60">{sub}</p>}
    </div>
  );
}

// small inline note for form saves: green = done, red = failed
export function Notice({ tone, children }: { tone: 'success' | 'error' | 'info'; children: ReactNode }) {
  return (
    <p
      className={clsx(
        'pop-in rounded-xl px-3 py-2 text-xs font-semibold ring-1',
        tone === 'success' && 'bg-green-50 text-green-800 ring-green-200',
        tone === 'error' && 'bg-red-50 text-red-700 ring-red-200',
        tone === 'info' && 'bg-ember/10 text-ink/70 ring-ember/20'
      )}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {children}
    </p>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center" role="dialog" aria-modal="true">
      <div className="pop-in glass w-full max-w-md rounded-2xl border border-ink/10 p-6 shadow-pop">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-extrabold">{title}</h3>
          <button ref={closeRef} onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-ink/5">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = 'Confirm',
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel?: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-ink/70">{body}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
