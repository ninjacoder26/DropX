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

export function cloudinaryThumb(url: string, width = 800): string {
  // Insert a Cloudinary-style scale transform if the URL is a Cloudinary delivery URL.
  if (!url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
}

export function discountPct(base: number, compareAt: number | null): number | null {
  if (!compareAt || compareAt <= base) return null;
  return Math.round(((compareAt - base) / compareAt) * 100);
}
