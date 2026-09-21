import { describe, expect, it } from 'vitest';
import { PAYMENT_METHODS } from '../src/lib/payments';

describe('cash on delivery — the only payment method', () => {
  it('offers exactly one method: COD', () => {
    expect(PAYMENT_METHODS.map((p) => p.method)).toEqual(['cod']);
  });

  it('has NO online providers and NO bank transfer', () => {
    const methods = PAYMENT_METHODS.map((p) => p.method);
    for (const banned of ['esewa', 'khalti', 'card', 'bank_transfer', 'manual']) {
      expect(methods).not.toContain(banned);
    }
  });

  it('documents the method honestly', () => {
    for (const p of PAYMENT_METHODS) {
      expect(p.label.length).toBeGreaterThan(2);
      expect(p.hint.length).toBeGreaterThan(10);
    }
  });
});
