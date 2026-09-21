import { describe, expect, it } from 'vitest';
import { PAYMENT_METHODS } from '../src/lib/payments';

describe('offline payment methods', () => {
  it('offers cash on delivery', () => {
    expect(PAYMENT_METHODS.some((p) => p.method === 'cod')).toBe(true);
  });

  it('offers manual bank transfer (admin-verified, never automatic)', () => {
    expect(PAYMENT_METHODS.some((p) => p.method === 'bank_transfer')).toBe(true);
  });

  it('has NO online providers — nothing to misconfigure or fake', () => {
    const methods = PAYMENT_METHODS.map((p) => p.method);
    expect(methods).not.toContain('esewa');
    expect(methods).not.toContain('khalti');
    expect(methods).not.toContain('card');
  });

  it('documents each method honestly', () => {
    for (const p of PAYMENT_METHODS) {
      expect(p.label.length).toBeGreaterThan(2);
      expect(p.hint.length).toBeGreaterThan(10);
    }
  });
});
