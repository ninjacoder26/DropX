import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { useStoreSettings, type StoreSettings } from './settings';
import { createTTLCache, registerCache } from './cache';
import type { DeliveryPlan } from '../types';

/**
 * Plan-based delivery, measured from the DropX hub in Imadol.
 * Plans come from the `delivery_plans` table (Admin → Delivery): each has
 * its own base fee + Rs/km rate, an on/off switch, and a product scope.
 * Instant ships paused (coming soon) until an admin activates it.
 */

export const HUB_NAME = 'Imadol';

export type DeliveryMethod = 'standard' | 'express' | 'instant';

/** Road km from Imadol. Covers every guided area (see lib/address.ts). */
export const AREA_KM: Record<string, number> = {
  // Kathmandu
  Thamel: 8, Lazimpat: 8.5, Baluwatar: 9, Maharajgunj: 10, Chabahil: 8.5,
  Boudha: 9.5, Jorpati: 11, Kapan: 12, Balaju: 10.5, Gongabu: 11.5,
  Kalanki: 11, Kalimati: 8.5, Tripureshwor: 6.5, 'New Baneshwor': 6,
  Koteshwor: 4.5, Sinamangal: 6.5, Gaushala: 7.5, 'Dilli Bazaar': 7,
  Putalisadak: 7, Teku: 7.5, Sitapaila: 10, Swayambhu: 9.5,
  // Lalitpur
  Pulchowk: 4.5, Jawalakhel: 4, Lagankhel: 3.5, Kupondole: 5, Jhamsikhel: 5,
  Sanepa: 5.5, Nakhipot: 6, Bhaisepati: 7.5, Hattiban: 6.5, Satdobato: 3,
  Ekantakuna: 4, Dhobighat: 6, Mangalbazar: 5, 'Patan Dhoka': 4.5, Imadol: 0.5,
  Tikathali: 2, Gwarko: 3, Harisiddhi: 4, Khokana: 8, Bungamati: 9,
  // Bhaktapur
  Kamalbinayak: 9, Suryabinayak: 7.5, Thimi: 6.5, Madhyapur: 7, Lokanthali: 6,
  Gatthaghar: 6.5, Kaushaltar: 5.5, Balkot: 8, Dadhikot: 9.5, Sipadol: 10.5,
  Sallaghari: 8.5, Byasi: 9, Taumadhi: 9.5, Katunje: 10, Jhaukhel: 11, Tathali: 10,
};

export function kmOfArea(area: string): number | null {
  const hit = Object.entries(AREA_KM).find(([name]) => name.toLowerCase() === area.trim().toLowerCase());
  return hit ? hit[1] : null;
}

export interface DeliveryQuote {
  method: string;
  km: number | null;
  fee: number | null; // null = pick an area first
  free: boolean;
}

/** Legacy fallback when delivery_plans hasn't been migrated yet. */
function legacyPlans(s: StoreSettings): DeliveryPlan[] {
  return [
    { key: 'standard', label: 'Standard', eta: '3–5 days', base_fee: 0, rate_per_km: s.deliveryRateStandard, is_active: true, scope: 'all', sort_order: 1, products: [] },
    { key: 'express', label: 'Express', eta: '1–3 days', base_fee: 0, rate_per_km: s.deliveryRateExpress, is_active: true, scope: 'all', sort_order: 2, products: [] },
    { key: 'instant', label: 'Instant', eta: 'within 6 hours', base_fee: 0, rate_per_km: 30, is_active: false, scope: 'all', sort_order: 3, products: [] },
  ];
}

const plansCache = createTTLCache<DeliveryPlan[]>(60_000);
registerCache(plansCache);

/** Peek at cached plans without fetching (for instant first paint). */
export function peekDeliveryPlans(): DeliveryPlan[] | null {
  return plansCache.get('plans') ?? null;
}

/** Drop cached plans (called automatically after admin writes). */
export function invalidateDeliveryCache(): void {
  plansCache.clear();
}

export async function fetchDeliveryPlans(s: StoreSettings): Promise<DeliveryPlan[]> {
  const hit = plansCache.get('plans');
  if (hit) return hit;
  if (!isSupabaseConfigured) return legacyPlans(s);
  try {
    const [{ data: plans }, { data: links }] = await Promise.all([
      supabase.from('delivery_plans').select('*').order('sort_order'),
      supabase.from('delivery_plan_products').select('plan_key,product_id'),
    ]);
    if (!plans || plans.length === 0) return legacyPlans(s);
    const byPlan = new Map<string, string[]>();
    for (const l of (links ?? []) as { plan_key: string; product_id: string }[]) {
      const arr = byPlan.get(l.plan_key) ?? [];
      arr.push(l.product_id);
      byPlan.set(l.plan_key, arr);
    }
    const mapped = (plans as unknown as Omit<DeliveryPlan, 'products'>[]).map((p) => ({
      ...p,
      base_fee: Number(p.base_fee),
      rate_per_km: Number(p.rate_per_km),
      products: byPlan.get(p.key) ?? [],
    }));
    plansCache.set('plans', mapped);
    return mapped;
  } catch {
    return legacyPlans(s);
  }
}

/** Reactive plans — live values when they land, legacy behavior meanwhile. */
export function useDeliveryPlans(): DeliveryPlan[] {
  const settings = useStoreSettings();
  const [plans, setPlans] = useState<DeliveryPlan[]>(() => peekDeliveryPlans() ?? legacyPlans(settings));
  useEffect(() => {
    let live = true;
    fetchDeliveryPlans(settings).then((p) => {
      if (live) setPlans(p);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return plans;
}

/** Does this plan serve a bag containing exactly these product ids? */
export function planAppliesToCart(
  plan: Pick<DeliveryPlan, 'is_active' | 'scope' | 'products'>,
  productIds: string[]
): { ok: boolean; reason: 'paused' | 'not-covered' | null } {
  if (!plan.is_active) return { ok: false, reason: 'paused' };
  if (plan.scope === 'all') return { ok: true, reason: null };
  const set = new Set(plan.products);
  const covered =
    plan.scope === 'include'
      ? productIds.every((id) => set.has(id))
      : productIds.every((id) => !set.has(id));
  return covered ? { ok: true, reason: null } : { ok: false, reason: 'not-covered' };
}

/** Client-side quote mirroring delivery_fee + place_order (024 prices every method from its own plan row). */
export function quoteWithPlan(
  plan: DeliveryPlan,
  area: string,
  subtotal: number,
  s: StoreSettings
): DeliveryQuote {
  const km = area.trim() ? kmOfArea(area) : null;
  if (km === null) return { method: plan.key, km, fee: null, free: false };
  if (plan.key === 'standard' && subtotal >= s.freeShippingThreshold) {
    return { method: plan.key, km, fee: 0, free: true };
  }
  return { method: plan.key, km, fee: Math.round(Number(plan.base_fee) + km * Number(plan.rate_per_km)), free: false };
}
