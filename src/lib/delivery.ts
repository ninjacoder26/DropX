import type { StoreSettings } from './settings';

/**
 * Place-dependent delivery, measured from the DropX hub in Imadol.
 * - Standard: Rs 10/km, 3–5 days (free over the configured threshold)
 * - Express:  Rs 20/km, 1–3 days
 * - Instant:  within 6 hours — COMING SOON (not orderable yet)
 * Distances are road-km approximations; rates come from Admin → Settings.
 */

export const HUB_NAME = 'Imadol';

export type DeliveryMethod = 'standard' | 'express' | 'instant';

export interface DeliveryMethodInfo {
  method: DeliveryMethod;
  label: string;
  eta: string;
  comingSoon?: boolean;
}

export const DELIVERY_METHODS: DeliveryMethodInfo[] = [
  { method: 'standard', label: 'Standard', eta: '3–5 days' },
  { method: 'express', label: 'Express', eta: '1–3 days' },
  { method: 'instant', label: 'Instant', eta: 'within 6 hours', comingSoon: true },
];

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
  method: DeliveryMethod;
  km: number | null;
  fee: number | null; // null = pick an area first
  free: boolean;
}

/** Client-side quote mirroring the server computation in 015. */
export function deliveryQuote(
  method: DeliveryMethod,
  area: string,
  subtotal: number,
  s: StoreSettings
): DeliveryQuote {
  if (method === 'instant') return { method, km: null, fee: null, free: false };
  const km = area.trim() ? kmOfArea(area) : null;
  if (km === null) return { method, km, fee: null, free: false };
  const rate = method === 'express' ? s.deliveryRateExpress : s.deliveryRateStandard;
  if (method === 'standard' && subtotal >= s.freeShippingThreshold) {
    return { method, km, fee: 0, free: true };
  }
  return { method, km, fee: Math.round(km * rate), free: false };
}
