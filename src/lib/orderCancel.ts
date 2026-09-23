/** Cancellation reasons — presets keep data consistent, custom text allowed. */

export const CUSTOMER_CANCEL_REASONS = [
  'Changed my mind',
  'Ordered the wrong item or size',
  'Found it cheaper elsewhere',
  'Delivery is taking too long',
  'Ordered by mistake',
  'Other',
] as const;

export const ADMIN_CANCEL_REASONS = [
  'Out of stock',
  'Customer requested cancellation',
  'Payment issue',
  'Undeliverable address',
  'Store maintenance closure',
  'Other',
] as const;

export const MAX_CANCEL_REASON = 500;

/** Combine a preset with optional custom text into the stored reason. */
export function buildCancelReason(preset: string, custom: string): string | null {
  const p = preset.trim();
  if (!p) return null;
  if (p.toLowerCase() !== 'other') return p.slice(0, MAX_CANCEL_REASON);
  const c = custom.trim();
  if (!c) return null;
  return c.slice(0, MAX_CANCEL_REASON);
}
