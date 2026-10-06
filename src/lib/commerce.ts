import { useStoreSettings, type StoreSettings } from './settings';

/**
 * Global commerce state — a legal/compliance switch, not a loading flag.
 * Single knob: COMMERCE_STATUS in config, overridable per-row in settings.
 * When paused: no checkout, no order submission, no payments — enforced in
 * place_order() server-side too, so direct API calls fail the same way.
 * Browsing always works; the PausePage explains why buying doesn't.
 */

export function commerceStatusOf(s: Pick<StoreSettings, 'commerceStatus'>): 'paused' | 'open' {
  return s.commerceStatus === 'open' ? 'open' : 'paused';
}

export function isCommercePaused(s: Pick<StoreSettings, 'commerceStatus'>): boolean {
  return commerceStatusOf(s) !== 'open';
}

/** Reactive pause flag — defaults first (fast paint), live value on land. */
export function useCommercePaused(): boolean {
  return isCommercePaused(useStoreSettings());
}
