import { describe, expect, it } from 'vitest';
import { resolveCheckoutPrefill } from '../src/lib/checkoutProfile';
import type { Address } from '../src/types';

const addr = (over: Partial<Address> = {}): Address => ({
  id: 'a1',
  user_id: 'u1',
  label: 'Home',
  full_name: 'Aashish Sharma',
  phone: '9811111111',
  province: 'Bagmati',
  city: 'Thamel',
  street: 'House 1',
  postal_code: null,
  is_default: true,
  ...over,
});

const prof = (over = {}) => ({
  checkout_name: 'P Name',
  checkout_phone: '9822222222',
  checkout_district: '',
  checkout_area: 'Jhamsikhel',
  checkout_street: 'Lane 2',
  checkout_postal: '',
  preferred_shipping: 'express',
  ...over,
});

describe('checkout prefill priority', () => {
  it('prefers a complete checkout profile and recovers the district', () => {
    const out = resolveCheckoutPrefill(prof(), [addr()]);
    expect(out.source).toBe('profile');
    expect(out).toMatchObject({ full_name: 'P Name', area: 'Jhamsikhel', district: 'Lalitpur', method: 'express' });
    expect(out.addressId).toBe('new'); // different street → not the saved entry
  });

  it('matches the saved entry when identical', () => {
    const out = resolveCheckoutPrefill(
      prof({ checkout_area: 'Thamel', checkout_street: 'House 1' }),
      [addr()]
    );
    expect(out.addressId).toBe('a1');
  });

  it('falls back to the address book, then blank', () => {
    const fromAddr = resolveCheckoutPrefill(
      { ...prof(), checkout_area: '', checkout_street: '' },
      [addr()]
    );
    expect(fromAddr.source).toBe('address');
    expect(fromAddr).toMatchObject({ area: 'Thamel', district: 'Kathmandu' });

    const blank = resolveCheckoutPrefill(null, []);
    expect(blank.source).toBe('blank');
    expect(blank.method).toBe('standard');
  });

  it('rejects unexpected shipping methods', () => {
    const out = resolveCheckoutPrefill(prof({ preferred_shipping: 'drone' }), []);
    expect(out.method).toBe('standard');
  });
});
