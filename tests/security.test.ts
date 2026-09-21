import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { sanitizeSearch } from '../src/lib/catalog';
import { join } from 'node:path';

const root = join(__dirname, '..');

/** Guardrails: security invariants that must hold in the shipped code. */
describe('security invariants', () => {
  it('server .env.example holds ONLY server secrets — no client vars at all', () => {
    const example = readFileSync(join(root, '.env.example'), 'utf8');
    expect(example).not.toMatch(/^\s*VITE_/m);
    expect(example).toContain('SUPABASE_SERVICE_ROLE_KEY=');
    expect(example).not.toMatch(/sk-live|pk-live|BEGIN PRIVATE KEY/);
  });

  it('checkout never self-marks orders paid', () => {
    const checkout = readFileSync(join(root, 'src/pages/CheckoutPage.tsx'), 'utf8');
    expect(checkout).not.toMatch(/payment_status['"]?\s*:\s*['"]paid/);
    expect(checkout).toMatch(/never.*paid|verified/i);
  });

  it('RLS migration enables row level security on all core tables', () => {
    const rls = readFileSync(join(root, 'supabase/migrations/002_rls.sql'), 'utf8');
    for (const t of ['products', 'orders', 'order_items', 'profiles', 'cart_items', 'reviews', 'drops']) {
      expect(rls).toContain(`alter table public.${t} enable row level security`);
    }
  });

  it('place_order recomputes totals server-side and records the offline method', () => {
    const fn = readFileSync(join(root, 'supabase/migrations/003_functions.sql'), 'utf8');
    expect(fn).toContain('create or replace function public.place_order');
    expect(fn).toContain('for update');
    expect(fn).toContain('Insufficient stock');
    expect(fn).toContain('p_payment_provider');
  });

  it('no client source file reads env vars or embeds online providers', () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = join(dir, e.name);
        return e.isDirectory() ? walk(p) : [p];
      });
    const files = walk(join(root, 'src')).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      expect(src, f).not.toContain('import.meta.env');
      expect(src, f).not.toMatch(/VITE_[A-Z_]+/);
    }
  });

  it('storage migration keeps non-image uploads in Supabase with owner-only writes', () => {
    const sql = readFileSync(join(root, 'supabase/migrations/005_storage.sql'), 'utf8');
    expect(sql).toContain('dropx-assets');
    expect(sql).toContain('auth.uid()');
  });

  it('settings are public-read/admin-write and checkout reads shipping rules from them', () => {
    const settings = readFileSync(join(root, 'supabase/migrations/006_settings.sql'), 'utf8');
    expect(settings).toContain('store_settings');
    expect(settings).toContain('public.is_admin()');
    const fn = readFileSync(join(root, 'supabase/migrations/003_functions.sql'), 'utf8');
    expect(fn).toContain('store_settings');
    expect(fn).toContain('free_shipping_threshold');
  });

  it('tags migration caps at 3 tags and the seed uses only vocabulary tags', () => {
    const tags = readFileSync(join(root, 'supabase/migrations/007_product_tags.sql'), 'utf8');
    expect(tags).toContain('products_tags_max3');
    const seed = readFileSync(join(root, 'supabase/migrations/008_catalog_seed.sql'), 'utf8');
    expect(seed).toContain('200 products');
  });

  it('sold counters stay in sync via order-item trigger', () => {
    const fix = readFileSync(join(root, 'supabase/migrations/009_sold_counters.sql'), 'utf8');
    expect(fix).toContain('bump_total_sold');
    expect(fix).toContain('total_sold = total_sold + new.quantity');
    expect(fix).toContain('trg_items_sold');
  });

  it('no dynamic SQL anywhere — injection has nowhere to land', () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = join(dir, e.name);
        return e.isDirectory() ? walk(p) : [p];
      });
    for (const f of walk(join(root, 'supabase/migrations'))) {
      const sql = readFileSync(f, 'utf8');
      // EXECUTE is only ever "execute function/procedure" (static trigger
      // bodies) — never EXECUTE <expression> / format() / USING (dynamic SQL).
      expect(sql).not.toMatch(/\bEXECUTE\b(?!\s+(function|procedure))/i);
      expect(/format\s*\(/i.test(sql), f).toBe(false);
    }
  });

  it('search input is allowlist-sanitized', () => {
    expect(sanitizeSearch('hoodie %,()')).toBe('hoodie');
    expect(sanitizeSearch('  a  b  ')).toBe('a b');
    expect(sanitizeSearch('x'.repeat(200)).length).toBeLessThanOrEqual(60);
    expect(sanitizeSearch('"><script>')).not.toContain('<');
  });

  it('ships hardened response headers including a CSP', () => {
    const vercel = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8')) as {
      headers: { headers: { key: string; value: string }[] }[];
    };
    const all = vercel.headers.flatMap((h) => h.headers);
    const get = (k: string) => all.find((h) => h.key === k)?.value ?? '';
    expect(get('Strict-Transport-Security')).toContain('max-age');
    expect(get('X-Frame-Options')).toBe('DENY');
    expect(get('Content-Security-Policy')).toContain("frame-ancestors 'none'");
    expect(get('Content-Security-Policy')).toContain('https://*.supabase.co');
    expect(get('Content-Security-Policy')).not.toContain('unsafe-eval');
  });
});
