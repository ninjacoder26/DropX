import { districtOfArea } from './address';
import type { Address, Profile } from '../types';

export interface CheckoutPrefill {
  full_name: string;
  phone: string;
  district: string;
  area: string;
  street: string;
  postal_code: string;
  method: 'standard' | 'express';
  /** Where the values came from — drives the address radio selection. */
  source: 'profile' | 'address' | 'blank';
  addressId: string | null;
}

type ProfileSlice = Pick<
  Profile,
  | 'checkout_name' | 'checkout_phone' | 'checkout_district'
  | 'checkout_area' | 'checkout_street' | 'checkout_postal'
  | 'preferred_shipping'
>;

/**
 * Prefill priority: saved checkout profile → default address book entry →
 * blank form. Method falls back to standard on anything unexpected.
 */
export function resolveCheckoutPrefill(
  profile: ProfileSlice | null,
  saved: Address[]
): CheckoutPrefill {
  const method: 'standard' | 'express' =
    profile?.preferred_shipping === 'express' ? 'express' : 'standard';

  if (profile && profile.checkout_area.trim() && profile.checkout_street.trim()) {
    const district =
      profile.checkout_district.trim() ||
      districtOfArea(profile.checkout_area) ||
      'Kathmandu';
    const match = saved.find(
      (a) => a.city === profile.checkout_area && a.street === profile.checkout_street
    );
    return {
      full_name: profile.checkout_name,
      phone: profile.checkout_phone,
      district,
      area: profile.checkout_area,
      street: profile.checkout_street,
      postal_code: profile.checkout_postal ?? '',
      method,
      source: 'profile',
      addressId: match ? match.id : 'new',
    };
  }

  const first = saved[0];
  if (first) {
    return {
      full_name: first.full_name,
      phone: first.phone,
      district: districtOfArea(first.city) ?? 'Kathmandu',
      area: first.city,
      street: first.street,
      postal_code: first.postal_code ?? '',
      method,
      source: 'address',
      addressId: first.id,
    };
  }

  return {
    full_name: '',
    phone: '',
    district: 'Kathmandu',
    area: '',
    street: '',
    postal_code: '',
    method,
    source: 'blank',
    addressId: 'new',
  };
}

/**
 * Detects "run migration 018" situations: the query failed because the
 * checkout_* columns don't exist yet. Surfaces as a helpful message
 * instead of a cryptic PostgREST error.
 */
export function isMissingColumnError(error: { message?: string } | null | undefined): boolean {
  const msg = error?.message ?? '';
  return /checkout_(name|phone|district|area|street|postal)|preferred_shipping/i.test(msg);
}

export const NEEDS_MIGRATION_MSG =
  'Checkout profiles need a database update: run supabase/migrations/018_checkout_profile.sql in the SQL Editor, then try again.';
