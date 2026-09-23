import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEES } from './shop';
import { createTTLCache, registerCache } from './cache';

/** Store-wide customizable copy + commerce rules (Admin → Settings). */
export interface StoreSettings {
  announcement: string;
  supportEmail: string;
  freeShippingThreshold: number;
  shippingStandard: number;
  shippingExpress: number;
  /** Profit margin %, applied as cost × (1 + margin/100). Default 20. */
  profitMargin: number;
  /** Rs per km from Imadol. Defaults: standard 10, express 20. */
  deliveryRateStandard: number;
  deliveryRateExpress: number;
  /** Maintenance page (Admin → Settings). Brand/theme stay fixed. */
  maintenanceEnabled: boolean;
  /** 'once' = bypass remembered for the session; 'always' = re-block on reload. */
  maintenanceFrequency: 'always' | 'once';
  maintenanceCountdown: number;
  maintenanceTitle: string;
  maintenanceMessage: string;
  maintenanceButton: string;
  maintenanceParticles: boolean;
  maintenanceContact: boolean;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  announcement: 'Free standard shipping over NPR 2,999',
  supportEmail: 'dropx.nepal@gmail.com',
  freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
  shippingStandard: SHIPPING_FEES.standard,
  shippingExpress: SHIPPING_FEES.express,
  profitMargin: 20,
  deliveryRateStandard: 10,
  deliveryRateExpress: 20,
  maintenanceEnabled: false,
  maintenanceFrequency: 'once',
  maintenanceCountdown: 6,
  maintenanceTitle: '',
  maintenanceMessage: '',
  maintenanceButton: '',
  maintenanceParticles: true,
  maintenanceContact: true,
};

const num = (v: string | undefined, fallback: number): number => {
  const n = Number(v);
  return v !== undefined && !Number.isNaN(n) && n >= 0 ? n : fallback;
};

const clampMargin = (m: number): number => Math.min(100, Math.max(0, m));

const truthy = (v: string | undefined): boolean =>
  v !== undefined && ['1', 'true', 'yes', 'on'].includes(v.trim().toLowerCase());

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
    deliveryRateStandard: num(get('delivery_rate_standard'), DEFAULT_SETTINGS.deliveryRateStandard),
    deliveryRateExpress: num(get('delivery_rate_express'), DEFAULT_SETTINGS.deliveryRateExpress),
    maintenanceEnabled: truthy(get('maintenance_enabled')),
    maintenanceFrequency: get('maintenance_frequency') === 'always' ? 'always' : 'once',
    maintenanceCountdown: Math.min(60, Math.max(0, Math.round(num(get('maintenance_countdown'), DEFAULT_SETTINGS.maintenanceCountdown)))),
    maintenanceTitle: get('maintenance_title')?.trim() ?? '',
    maintenanceMessage: get('maintenance_message')?.trim() ?? '',
    maintenanceButton: get('maintenance_button')?.trim() ?? '',
    maintenanceParticles: get('maintenance_particles') == null ? true : truthy(get('maintenance_particles')),
    maintenanceContact: get('maintenance_contact') == null ? true : truthy(get('maintenance_contact')),
  };
}

const settingsCache = createTTLCache<StoreSettings>(60_000);
registerCache(settingsCache);

/** Peek at the cached settings without fetching (for instant first paint). */
export function peekSettings(): StoreSettings | null {
  return settingsCache.get('settings') ?? null;
}

/** Drop cached settings (called automatically after admin writes). */
export function invalidateSettingsCache(): void {
  settingsCache.clear();
}

export async function fetchSettings(): Promise<StoreSettings> {
  const hit = settingsCache.get('settings');
  if (hit) return hit;
  if (!isSupabaseConfigured) return DEFAULT_SETTINGS;
  try {
    const { data, error } = await supabase.from('store_settings').select('key,value');
    if (error) throw error;
    const mapped = mapSettings((data ?? []) as { key: string; value: string }[]);
    settingsCache.set('settings', mapped);
    return mapped;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Reactive hook — defaults first (fast paint), live values when they land. */
export function useStoreSettings(): StoreSettings {
  const [settings, setSettings] = useState<StoreSettings>(() => peekSettings() ?? DEFAULT_SETTINGS);
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
