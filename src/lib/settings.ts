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
  /** Profit margin %, applied as cost × (1 + margin/100). Default 20. */
  profitMargin: number;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  announcement: 'Free standard shipping over NPR 2,999',
  supportEmail: 'dropx.nepal@gmail.com',
  freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
  shippingStandard: SHIPPING_FEES.standard,
  shippingExpress: SHIPPING_FEES.express,
  profitMargin: 20,
};

const num = (v: string | undefined, fallback: number): number => {
  const n = Number(v);
  return v !== undefined && !Number.isNaN(n) && n >= 0 ? n : fallback;
};

const clampMargin = (m: number): number => Math.min(100, Math.max(0, m));

/** Storefront selling price from a real cost + margin %. Whole rupees. */
export function sellingFromCost(cost: number, marginPct: number): number {
  return Math.round(Number(cost) * (1 + clampMargin(marginPct) / 100));
}

/** Back out the real cost from a selling price + margin %. */
export function costFromSelling(base: number, marginPct: number): number {
  return Math.round((Number(base) / (1 + clampMargin(marginPct) / 100)) * 100) / 100;
}

/** Pure mapper — rows from store_settings into a complete StoreSettings. */
export function mapSettings(rows: { key: string; value: string }[]): StoreSettings {
  const get = (k: string) => rows.find((r) => r.key === k)?.value;
  return {
    announcement: get('announcement')?.trim() || DEFAULT_SETTINGS.announcement,
    supportEmail: get('support_email')?.trim() || DEFAULT_SETTINGS.supportEmail,
    freeShippingThreshold: num(get('free_shipping_threshold'), DEFAULT_SETTINGS.freeShippingThreshold),
    shippingStandard: num(get('shipping_standard'), DEFAULT_SETTINGS.shippingStandard),
    shippingExpress: num(get('shipping_express'), DEFAULT_SETTINGS.shippingExpress),
    profitMargin: clampMargin(num(get('profit_margin'), DEFAULT_SETTINGS.profitMargin)),
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
