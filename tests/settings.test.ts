import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, costFromSelling, mapSettings, sellingFromCost, shippingFeeFor } from '../src/lib/settings';

describe('store settings', () => {
  it('falls back to defaults on empty rows', () => {
    expect(mapSettings([])).toEqual(DEFAULT_SETTINGS);
  });

  it('maps rows and ignores invalid numbers', () => {
    const s = mapSettings([
      { key: 'announcement', value: 'Dashain sale!' },
      { key: 'free_shipping_threshold', value: '5000' },
      { key: 'shipping_standard', value: 'abc' },
      { key: 'shipping_express', value: '-10' },
    ]);
    expect(s.announcement).toBe('Dashain sale!');
    expect(s.freeShippingThreshold).toBe(5000);
    expect(s.shippingStandard).toBe(DEFAULT_SETTINGS.shippingStandard);
    expect(s.shippingExpress).toBe(DEFAULT_SETTINGS.shippingExpress);
  });

  it('computes shipping from live settings', () => {
    const s = { ...DEFAULT_SETTINGS, freeShippingThreshold: 5000, shippingStandard: 120, shippingExpress: 250 };
    expect(shippingFeeFor('standard', 5000, s)).toBe(0);
    expect(shippingFeeFor('standard', 4999, s)).toBe(120);
    expect(shippingFeeFor('express', 99999, s)).toBe(250);
  });

  it('defaults the profit margin to 20% and clamps 0–100', () => {
    expect(mapSettings([]).profitMargin).toBe(20);
    expect(mapSettings([{ key: 'profit_margin', value: '35' }]).profitMargin).toBe(35);
    expect(mapSettings([{ key: 'profit_margin', value: '250' }]).profitMargin).toBe(100);
    expect(mapSettings([{ key: 'profit_margin', value: 'junk' }]).profitMargin).toBe(20);
  });

  it('prices as cost + margin, whole rupees', () => {
    expect(sellingFromCost(1000, 20)).toBe(1200);
    expect(sellingFromCost(1350, 20)).toBe(1620);
    expect(sellingFromCost(999, 0)).toBe(999);
    expect(costFromSelling(1200, 20)).toBe(1000);
  });
});
