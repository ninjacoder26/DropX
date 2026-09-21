import { describe, expect, it } from 'vitest';
import { AREA_KM, DELIVERY_METHODS, deliveryQuote, kmOfArea } from '../src/lib/delivery';
import { VALLEY_DISTRICTS } from '../src/lib/address';
import { DEFAULT_SETTINGS } from '../src/lib/settings';

describe('distance delivery from Imadol', () => {
  it('covers every guided area exactly once', () => {
    const guided = VALLEY_DISTRICTS.flatMap((d) => d.areas);
    expect(guided.length).toBe(58);
    for (const a of guided) {
      expect(AREA_KM[a], a).toBeDefined();
    }
    expect(Object.keys(AREA_KM).length).toBe(58);
  });

  it('quotes Rs 10/km standard and Rs 20/km express', () => {
    const thamel = deliveryQuote('standard', 'Thamel', 500, DEFAULT_SETTINGS);
    expect(thamel).toMatchObject({ km: 8, fee: 80, free: false });
    const express = deliveryQuote('express', 'Thamel', 500, DEFAULT_SETTINGS);
    expect(express).toMatchObject({ km: 8, fee: 160, free: false });
  });

  it('keeps free standard shipping over the threshold', () => {
    const q = deliveryQuote('standard', 'Boudha', 5000, DEFAULT_SETTINGS);
    expect(q).toMatchObject({ fee: 0, free: true });
    const paid = deliveryQuote('express', 'Boudha', 50000, DEFAULT_SETTINGS);
    expect(paid.free).toBe(false);
  });

  it('asks for an area before quoting, and parks instant as coming soon', () => {
    expect(deliveryQuote('standard', '', 500, DEFAULT_SETTINGS).fee).toBeNull();
    expect(kmOfArea('Pokhara')).toBeNull();
    expect(deliveryQuote('instant', 'Thamel', 500, DEFAULT_SETTINGS).fee).toBeNull();
    expect(DELIVERY_METHODS.find((m) => m.method === 'instant')?.comingSoon).toBe(true);
  });
});
