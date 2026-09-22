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

  it('no dead fire-and-forget writes (bare `void supabase…` never sends)', () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = join(dir, e.name);
        return e.isDirectory() ? walk(p) : [p];
      });
    const files = walk(join(root, 'src')).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      expect(src, f).not.toMatch(/void\s+supabase\./);
    }
  });

  it('no client source file reads env vars or embeds online providers', () => {    const walk = (dir: string): string[] =>
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

  it('drop restore is guarded and rerunnable', () => {
    const fix = readFileSync(join(root, 'supabase/migrations/012_restore_drops.sql'), 'utf8');
    expect(fix).toContain('where not exists');
    expect(fix).toContain('ashwin-drop-city-after-monsoon');
    expect(fix).toContain('dashain-mega-drop-2026');
  });

  it('margin system stores real costs with a sane default', () => {
    const fix = readFileSync(join(root, 'supabase/migrations/013_margin.sql'), 'utf8');
    expect(fix).toContain('cost_price');
    expect(fix).toContain("('profit_margin', '20')");
  });

  it('demand layer tracks events without exposing who did what', () => {
    const sql = readFileSync(join(root, 'supabase/migrations/020_demand.sql'), 'utf8');
    expect(sql).toContain('product_events');
    expect(sql).toContain('product_requests');
    expect(sql).toContain('product_popularity');
    expect(sql).toContain('related_by_session');
    expect(sql).toContain('uq_requests_user_query');
    // The popularity aggregate must not output user/session columns
    // (related_by_session groups BY session internally but returns counts).
    const popFn = sql.slice(sql.indexOf('product_popularity()'), sql.indexOf('related_by_session'));
    expect(popFn).not.toMatch(/user_id|session_id/);
  });

  it('distance delivery prices from zones, rejects instant', () => {
    const fix = readFileSync(join(root, 'supabase/migrations/015_distance_delivery.sql'), 'utf8');
    expect(fix).toContain('delivery_zones');
    expect(fix).toContain('delivery_fee');
    expect(fix).toContain('Instant delivery is coming soon');
    expect(fix).toContain('Skeleton parent row FIRST');
  });

  it('plan engine scopes products and prices base + distance', () => {
    const fix = readFileSync(join(root, 'supabase/migrations/019_delivery_plans.sql'), 'utf8');
    expect(fix).toContain('delivery_plans');
    expect(fix).toContain('delivery_plan_products');
    expect(fix).toContain('delivery_plan_applies');
    expect(fix).toContain("scope in ('all', 'include', 'exclude')");
    expect(fix).toContain('round(v_base + v_km * v_rate)');
  });

  it('brand + specs columns exist with a full backfill', () => {
    const cols = readFileSync(join(root, 'supabase/migrations/016_brand_specs.sql'), 'utf8');
    expect(cols).toContain('brand');
    expect(cols).toContain('specs jsonb');
    const backfill = readFileSync(join(root, 'supabase/migrations/017_product_specs.sql'), 'utf8');
    expect(backfill.split('\n').filter((l) => l.startsWith('update public.products set')).length).toBe(200);
  });

  it('place_order inserts the parent order before its items (FK-safe) and is COD-only', () => {
    const fix = readFileSync(join(root, 'supabase/migrations/014_place_order_fix.sql'), 'utf8');
    expect(fix).toContain('Skeleton parent row FIRST');
    expect(fix).toContain('update public.orders');
    expect(fix).toContain("Cash on Delivery only");
    expect(fix).not.toContain('bank_transfer');
  });

  it('021 closes direct order writes, rate-limits events, and idempotizes checkout', () => {
    const fix = readFileSync(join(root, 'supabase/migrations/021_hardening.sql'), 'utf8');
    expect(fix).toContain('drop policy if exists "owner insert own orders"');
    expect(fix).toContain('drop policy if exists "owner insert own order items"');
    expect(fix).toContain('trg_events_rate');
    expect(fix).toContain('trg_requests_rate');
    expect(fix).toContain('idempotency_key');
    expect(fix).toContain('idx_orders_placed');
    expect(fix).toContain('public read images of live products');
    const checkout = readFileSync(join(root, 'src/pages/CheckoutPage.tsx'), 'utf8');
    expect(checkout).toContain('p_idempotency_key');
  });

  it('server endpoints validate their inputs', () => {
    const sign = readFileSync(join(root, 'api/cloudinary-sign.ts'), 'utf8');
    expect(sign).toContain('dropx/');
    const del = readFileSync(join(root, 'api/cloudinary-delete.ts'), 'utf8');
    expect(del).toContain('Invalid public_id');
    expect(del).toContain('Invalid JSON body');
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

  it('ships hardened response headers including a CSP', () => {    const vercel = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8')) as {
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
