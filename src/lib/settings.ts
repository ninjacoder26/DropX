import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEES } from './shop';

/** Store-wide customizable copy + commerce rules (Admin → Settings). */
export interface StoreSettings {
  announcement: string;
  supportEmail: string;
  freeShippingThreshold: number;
  shippingStandard: number;
  shippingExpress: number;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  announcement: 'Free standard shipping over NPR 2,999',
  supportEmail: 'dropx.nepal@gmail.com',
  freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
  shippingStandard: SHIPPING_FEES.standard,
  shippingExpress: SHIPPING_FEES.express,
};

const num = (v: string | undefined, fallback: number): number => {
  const n = Number(v);
  return v !== undefined && !Number.isNaN(n) && n >= 0 ? n : fallback;
};

/** Pure mapper — rows from store_settings into a complete StoreSettings. */
export function mapSettings(rows: { key: string; value: string }[]): StoreSettings {
  const get = (k: string) => rows.find((r) => r.key === k)?.value;
  return {
    announcement: get('announcement')?.trim() || DEFAULT_SETTINGS.announcement,
    supportEmail: get('support_email')?.trim() || DEFAULT_SETTINGS.supportEmail,
    freeShippingThreshold: num(get('free_shipping_threshold'), DEFAULT_SETTINGS.freeShippingThreshold),
    shippingStandard: num(get('shipping_standard'), DEFAULT_SETTINGS.shippingStandard),
    shippingExpress: num(get('shipping_express'), DEFAULT_SETTINGS.shippingExpress),
  };
}

let cache: StoreSettings | null = null;

export async function fetchSettings(): Promise<StoreSettings> {
  if (cache) return cache;
  if (!isSupabaseConfigured) return DEFAULT_SETTINGS;
  try {
    const { data, error } = await supabase.from('store_settings').select('key,value');
    if (error) throw error;
    cache = mapSettings((data ?? []) as { key: string; value: string }[]);
    return cache;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Reactive hook — defaults first (fast paint), live values when they land. */
export function useStoreSettings(): StoreSettings {
  const [settings, setSettings] = useState<StoreSettings>(() => cache ?? DEFAULT_SETTINGS);
  useEffect(() => {
    let live = true;
    fetchSettings().then((s) => {
      if (live) setSettings(s);
    });
    return () => {
      live = false;
    };
  }, []);
  return settings;
}

export function shippingFeeFor(
  method: 'standard' | 'express',
  subtotal: number,
  s: StoreSettings
): number {
  if (method === 'standard' && subtotal >= s.freeShippingThreshold) return 0;
  return method === 'express' ? s.shippingExpress : s.shippingStandard;
}
