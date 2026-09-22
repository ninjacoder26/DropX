import { describe, expect, it } from 'vitest';
import { isValidEmail, LIMITS } from '../src/lib/validation';

describe('report validation', () => {
  it('accepts real emails and rejects junk', () => {
    expect(isValidEmail('legal@acme.com')).toBe(true);
    expect(isValidEmail('  a.b@x.co  ')).toBe(true);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('keeps sane bounds for brand, reason and notes', () => {
    expect(LIMITS.brandName.min).toBe(2);
    expect(LIMITS.reason.min).toBe(10);
    expect(LIMITS.reason.max).toBe(2000);
  });
});
