/**
 * Tiny CSV utilities for the admin product import/export.
 * No dependencies. Handles quoted fields, commas and newlines inside quotes.
 */

export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c === '\r') {
      /* ignore */
    } else {
      field += c;
    }
  }
  row.push(field);
  rows.push(row);
  // Drop trailing empty row from final newline
  while (rows.length > 0 && rows[rows.length - 1].every((f) => f.trim() === '')) rows.pop();
  return rows;
}

export function toCSV(rows: (string | number | boolean | null)[][]): string {
  const esc = (v: string | number | boolean | null) => {
    const s = v === null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(esc).join(',')).join('\n') + '\n';
}

import { MAX_TAGS_PER_PRODUCT, TAG_VOCABULARY, normalizeTags } from './tags';

export const PRODUCT_CSV_HEADERS = [
  'name',
  'slug',
  'description',
  'category_slug',
  'base_price',
  'compare_at_price',
  'is_active',
  'is_featured',
  'is_trending',
  'is_new',
  'tags',
  'cost_price',
] as const;

export interface ProductCSVRow {
  line: number;
  name: string;
  slug: string;
  description: string;
  category_slug: string;
  base_price: number;
  compare_at_price: number | null;
  is_active: boolean;
  is_featured: boolean;
  is_trending: boolean;
  is_new: boolean;
  tags: string[];
  /** Real cost; when present the selling price is recomputed with the live margin. */
  cost_price: number | null;
}

const truthy = (v: string) => ['1', 'true', 'yes', 'y'].includes(v.trim().toLowerCase());

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Validate raw CSV rows. Returns valid rows + per-line error messages. */
export function validateProductRows(raw: string[][]): { valid: ProductCSVRow[]; errors: string[] } {
  const valid: ProductCSVRow[] = [];
  const errors: string[] = [];
  if (raw.length === 0) return { valid, errors: ['File is empty.'] };
  const header = raw[0].map((h) => h.trim().toLowerCase());
  if (header[0] !== 'name' || !header.includes('base_price')) {
    return {
      valid,
      errors: [`Bad header. Expected: ${PRODUCT_CSV_HEADERS.join(',')}`],
    };
  }
  const idx = (name: string) => header.indexOf(name);
  for (let i = 1; i < raw.length; i++) {
    const line = i + 1;
    const cell = (name: string) => (raw[i][idx(name)] ?? '').trim();
    const name = cell('name');
    const price = Number(cell('base_price'));
    if (!name) {
      errors.push(`Line ${line}: name is required.`);
      continue;
    }
    if (!cell('base_price') || Number.isNaN(price) || price < 0) {
      errors.push(`Line ${line} (“${name}”): base_price must be a number ≥ 0.`);
      continue;
    }
    const compareRaw = idx('compare_at_price') >= 0 ? cell('compare_at_price') : '';
    const compare = compareRaw ? Number(compareRaw) : null;
    if (compareRaw && (Number.isNaN(compare!) || compare! < 0)) {
      errors.push(`Line ${line} (“${name}”): compare_at_price must be a number ≥ 0.`);
      continue;
    }
    // Tags: pipe-separated, fixed vocabulary only, max 3. Unknown tags are
    // reported (not silently dropped) so catalogs stay clean.
    const rawTags = idx('tags') >= 0 ? cell('tags') : '';
    const tagList = rawTags ? rawTags.split('|').map((t) => t.trim().toLowerCase()).filter(Boolean) : [];
    const unknown = tagList.filter((t) => !(TAG_VOCABULARY as readonly string[]).includes(t));
    if (unknown.length > 0) {
      errors.push(`Line ${line} (“${name}”): unknown tags: ${unknown.join(', ')}. Allowed: ${TAG_VOCABULARY.join(', ')}.`);
      continue;
    }
    if (tagList.length > MAX_TAGS_PER_PRODUCT) {
      errors.push(`Line ${line} (“${name}”): at most ${MAX_TAGS_PER_PRODUCT} tags allowed.`);
      continue;
    }
    const costRaw = idx('cost_price') >= 0 ? cell('cost_price') : '';
    const cost = costRaw ? Number(costRaw) : null;
    if (costRaw && (Number.isNaN(cost!) || cost! < 0)) {
      errors.push(`Line ${line} (“${name}”): cost_price must be a number ≥ 0.`);
      continue;
    }
    valid.push({
      line,
      name,
      slug: cell('slug') || slugify(name),
      description: cell('description'),
      category_slug: cell('category_slug'),
      base_price: price,
      compare_at_price: compare,
      is_active: idx('is_active') < 0 ? true : truthy(cell('is_active') || 'true'),
      is_featured: truthy(cell('is_featured')),
      is_trending: truthy(cell('is_trending')),
      is_new: idx('is_new') < 0 ? true : truthy(cell('is_new') || 'true'),
      tags: normalizeTags(tagList),
      cost_price: cost,
    });
  }
  return { valid, errors };
}
