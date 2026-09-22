import { describe, expect, it } from 'vitest';
import {
  AREA_KM,
  kmOfArea,
  planAppliesToCart,
  quoteWithPlan,
} from '../src/lib/delivery';
import { VALLEY_DISTRICTS } from '../src/lib/address';
import { DEFAULT_SETTINGS } from '../src/lib/settings';
import type { DeliveryPlan } from '../src/types';

const plan = (over: Partial<DeliveryPlan> = {}): DeliveryPlan => ({
  key: 'standard',
  label: 'Standard',
  eta: '3–5 days',
  base_fee: 0,
  rate_per_km: 10,
  is_active: true,
  scope: 'all',
  sort_order: 1,
  products: [],
  ...over,
});

describe('distance delivery from Imadol', () => {
  it('covers every guided area exactly once', () => {
    const guided = VALLEY_DISTRICTS.flatMap((d) => d.areas);
    expect(guided.length).toBe(58);
    for (const a of guided) {
      expect(AREA_KM[a], a).toBeDefined();
    }
    expect(Object.keys(AREA_KM).length).toBe(58);
  });

  it('quotes base + km × rate', () => {
    const p = plan({ base_fee: 50, rate_per_km: 10 });
    const q = quoteWithPlan(p, 'Thamel', 500, DEFAULT_SETTINGS);
    expect(q).toMatchObject({ km: 8, fee: 130, free: false });
  });

  it('keeps free standard shipping over the threshold', () => {
    const q = quoteWithPlan(plan(), 'Boudha', 5000, DEFAULT_SETTINGS);
    expect(q).toMatchObject({ fee: 0, free: true });
  });

  it('asks for an area before quoting', () => {
    expect(quoteWithPlan(plan(), '', 500, DEFAULT_SETTINGS).fee).toBeNull();
    expect(kmOfArea('Pokhara')).toBeNull();
  });

  it('applies plans by scope: all, include, exclude', () => {
    expect(planAppliesToCart(plan({ scope: 'all' }), ['a', 'b']).ok).toBe(true);
    expect(planAppliesToCart(plan({ scope: 'include', products: ['a'] }), ['a']).ok).toBe(true);
    expect(planAppliesToCart(plan({ scope: 'include', products: ['a'] }), ['a', 'b']).ok).toBe(false);
    expect(planAppliesToCart(plan({ scope: 'exclude', products: ['b'] }), ['a']).ok).toBe(true);
    expect(planAppliesToCart(plan({ scope: 'exclude', products: ['b'] }), ['a', 'b']).ok).toBe(false);
  });

  it('paused plans never apply', () => {
    const r = planAppliesToCart(plan({ is_active: false }), ['a']);
    expect(r).toEqual({ ok: false, reason: 'paused' });
  });
});
