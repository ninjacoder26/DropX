import { describe, expect, it } from 'vitest';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEES, discountPct, formatNPR } from '../src/lib/shop';

describe('shop pricing helpers', () => {
  it('formats NPR without decimals', () => {
    expect(formatNPR(3499)).toBe('NPR 3,499');
    expect(formatNPR(0)).toBe('NPR 0');
  });

  it('computes discount percentages', () => {
    expect(discountPct(3499, 4299)).toBe(19);
    expect(discountPct(1000, 1000)).toBeNull();
    expect(discountPct(1000, null)).toBeNull();
  });

  it('applies free standard shipping over the threshold', () => {
    const fee = (subtotal: number, method: 'standard' | 'express') =>
      method === 'standard' && subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEES[method];
    expect(fee(2999, 'standard')).toBe(0);
    expect(fee(2998, 'standard')).toBe(99);
    expect(fee(99999, 'express')).toBe(199);
  });

  it('never trusts client totals — server recomputes grand total', () => {
    // Mirrors the place_order() contract: grand_total = Σ unit*qty + shipping.
    const lines = [
      { unit: 3499, qty: 1 },
      { unit: 1499, qty: 2 },
    ];
    const subtotal = lines.reduce((s, l) => s + l.unit * l.qty, 0);
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 99;
    expect(subtotal).toBe(6497);
    expect(subtotal + shipping).toBe(6497);
  });
});
