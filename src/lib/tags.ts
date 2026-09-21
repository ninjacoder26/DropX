/**
 * DropX tag vocabulary — the ONLY tags that may exist.
 * Fixed on purpose: no free-text tag creation anywhere (admin form, CSV
 * import and seed data all validate against this list), max 3 per product.
 * Tags power discovery (shop filter chips) and the recommendation engine.
 */

export const TAG_VOCABULARY = [
  'writing',
  'paper',
  'art',
  'desk',
  'school',
  'audio',
  'charging',
  'power',
  'mobile',
  'laptop',
  'wearable',
  'apparel',
  'footwear',
  'winter',
  'bags',
  'accessories',
  'home',
  'decor',
  'lighting',
  'kitchen',
  'fitness',
  'outdoor',
  'games',
  'travel',
] as const;

export type ProductTag = (typeof TAG_VOCABULARY)[number];

export const MAX_TAGS_PER_PRODUCT = 3;

const VALID = new Set<string>(TAG_VOCABULARY);

export function isValidTag(tag: string): tag is ProductTag {
  return VALID.has(tag.trim().toLowerCase());
}

/** Normalize arbitrary input to at most MAX_TAGS_PER_PRODUCT valid tags. */
export function normalizeTags(input: unknown): ProductTag[] {
  const list = Array.isArray(input) ? input : typeof input === 'string' ? input.split('|') : [];
  const seen = new Set<ProductTag>();
  for (const raw of list) {
    const t = String(raw).trim().toLowerCase();
    if (VALID.has(t) && !seen.has(t as ProductTag)) {
      seen.add(t as ProductTag);
      if (seen.size >= MAX_TAGS_PER_PRODUCT) break;
    }
  }
  return [...seen];
}
