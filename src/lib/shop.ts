/** NPR formatting + shared shop constants. */

export function formatNPR(value: number | string): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return 'NPR 0';
  return 'NPR ' + n.toLocaleString('en-NP', { maximumFractionDigits: 0 });
}

export const FREE_SHIPPING_THRESHOLD = 2999;
export const SHIPPING_FEES: Record<string, number> = {
  standard: 99,
  express: 199,
};

export const NEPAL_PROVINCES = [
  'Koshi',
  'Madhesh',
  'Bagmati',
  'Gandaki',
  'Lumbini',
  'Karnali',
  'Sudurpashchim',
];

export function cloudinaryThumb(
  url: string,
  width = 800,
  quality: 'auto' | 'eco' | 'good' = 'auto'
): string {
  // Insert a Cloudinary delivery transform if this is a Cloudinary URL.
  // - auto: f_auto,q_auto — balanced default for hero/gallery imagery.
  // - eco:  f_auto,q_auto:eco — ~40% fewer bytes, for grids, tiles, teasers.
  // - good: f_auto,q_auto:good — near-lossless, for full product views.
  if (!url.includes('/upload/')) return url;
  const q = quality === 'auto' ? 'q_auto' : `q_auto:${quality}`;
  return url.replace('/upload/', `/upload/f_auto,${q},w_${width}/`);
}

export function discountPct(base: number, compareAt: number | null): number | null {
  if (!compareAt || compareAt <= base) return null;
  return Math.round(((compareAt - base) / compareAt) * 100);
}
