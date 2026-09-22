import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, costFromSelling, mapSettings, sellingFromCost } from '../src/lib/settings';
import { quoteWithPlan } from '../src/lib/delivery';
import type { DeliveryPlan } from '../src/types';

const stdPlan: DeliveryPlan = {
  key: 'standard', label: 'Standard', eta: '3–5 days',
  base_fee: 0, rate_per_km: 10, is_active: true, scope: 'all', sort_order: 1, products: [],
};

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
    const s = { ...DEFAULT_SETTINGS, freeShippingThreshold: 5000 };
    expect(quoteWithPlan(stdPlan, 'Thamel', 5000, s)).toMatchObject({ fee: 0, free: true });
    expect(quoteWithPlan(stdPlan, 'Thamel', 4999, s)).toMatchObject({ fee: 80, free: false });
    expect(quoteWithPlan({ ...stdPlan, key: 'express' }, 'Thamel', 99999, s).free).toBe(false);
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

  it('maps maintenance controls with safe defaults', () => {
    const d = mapSettings([]);
    expect(d).toMatchObject({
      maintenanceEnabled: false,
      maintenanceFrequency: 'once',
      maintenanceCountdown: 6,
      maintenanceParticles: true,
      maintenanceContact: true,
    });
    const on = mapSettings([
      { key: 'maintenance_enabled', value: '1' },
      { key: 'maintenance_frequency', value: 'always' },
      { key: 'maintenance_countdown', value: '10' },
      { key: 'maintenance_title', value: 'Back soon' },
      { key: 'maintenance_particles', value: '0' },
    ]);
    expect(on).toMatchObject({
      maintenanceEnabled: true,
      maintenanceFrequency: 'always',
      maintenanceCountdown: 10,
      maintenanceTitle: 'Back soon',
      maintenanceParticles: false,
      maintenanceContact: true,
    });
    expect(mapSettings([{ key: 'maintenance_countdown', value: '999' }]).maintenanceCountdown).toBe(60);
    expect(mapSettings([{ key: 'maintenance_frequency', value: 'sometimes' }]).maintenanceFrequency).toBe('once');
  });
});
