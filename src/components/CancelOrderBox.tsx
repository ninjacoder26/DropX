import { useState } from 'react';
import { buildCancelReason } from '../lib/orderCancel';
import { Button, Notice } from './ui';

/**
 * Cancel-with-reason box. Closed state is one quiet button; opening asks
 * for a preset reason (plus free text for Other) and confirms explicitly.
 * The parent performs the actual RPC and refreshes.
 */
export function CancelOrderBox({
  presets,
  title,
  body,
  confirmLabel = 'Confirm cancellation',
  onConfirm,
}: {
  presets: readonly string[];
  title: string;
  body: string;
  confirmLabel?: string;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<string>(presets[0] ?? 'Other');
  const [custom, setCustom] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => {
          setOpen(true);
          setMsg(null);
        }}
        className="rounded-full border border-red-200 px-4 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50"
      >
        {title}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4">
      <p className="text-sm font-bold text-red-800">{title}</p>
      <p className="mt-0.5 text-xs text-ink/60">{body}</p>
      <label className="mt-3 block text-xs font-bold uppercase tracking-wider text-ink/60" htmlFor="cancel-reason">
        Reason (required)
      </label>
      <select
        id="cancel-reason"
        value={preset}
        onChange={(e) => setPreset(e.target.value)}
        className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm"
      >
        {presets.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      {preset.toLowerCase() === 'other' && (
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Tell us briefly why…"
          maxLength={500}
          className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm"
          aria-label="Custom cancellation reason"
        />
      )}
      {msg && (
        <div className="mt-2">
          <Notice tone="error">{msg}</Notice>
        </div>
      )}
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" disabled={busy} onClick={() => setOpen(false)}>Keep order</Button>
        <Button
          variant="danger"
          disabled={busy}
          onClick={() => {
            const reason = buildCancelReason(preset, custom);
            if (!reason) {
              setMsg('Pick a reason — or choose Other and write one.');
              return;
            }
            setBusy(true);
            setMsg(null);
            onConfirm(reason).then(
              () => setBusy(false),
              (e: unknown) => {
                setBusy(false);
                setMsg(e instanceof Error ? e.message : 'Cancellation failed. Try again.');
              }
            );
          }}
        >
          {busy ? 'Cancelling…' : confirmLabel}
        </Button>
      </div>
    </div>
  );
}
