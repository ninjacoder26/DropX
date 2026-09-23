import { beforeEach, describe, expect, it, vi } from 'vitest';

const { tableData, calls } = vi.hoisted(() => ({
  tableData: {} as Record<string, unknown>,
  calls: { from: 0, rpc: 0 },
}));

vi.mock('../src/lib/supabase', () => {
  // Minimal PostgREST-shaped chainable: every filter returns itself, and the
  // whole chain is awaitable, resolving with the current mock table data.
  function chainable(get: () => unknown): Record<string, any> {
    const obj: Record<string, any> = {};
    for (const m of ['select', 'eq', 'order', 'limit', 'in', 'or', 'single', 'insert']) {
      obj[m] = (..._args: unknown[]) => obj;
    }
    obj.then = (onF: (v: unknown) => unknown, onR?: (e: unknown) => unknown) => {
      const raw = get();
      const settled =
        raw instanceof Error ? { data: null, error: { message: raw.message } } : { data: raw, error: null };
      return Promise.resolve(settled).then(onF as never, onR as never);
    };
    return obj;
  }
  return {
    isSupabaseConfigured: true,
    supabase: {
      from: (t: string) => {
        calls.from += 1;
        return chainable(() => tableData[t] ?? []);
      },
      rpc: (_fn: string, ..._args: unknown[]) => {
        calls.rpc += 1;
        const raw = tableData.__rpc ?? [];
        const settled =
          raw instanceof Error ? { data: null, error: { message: raw.message } } : { data: raw, error: null };
        return Promise.resolve(settled);
      },
    },
  };
});

import {
  fetchCategories,
  fetchDrops,
  fetchProductBySlug,
  fetchProducts,
  fetchProductsByIds,
  invalidateCatalogCache,
} from '../src/lib/catalog';
import { DEFAULT_SETTINGS, fetchSettings, invalidateSettingsCache } from '../src/lib/settings';
import { fetchDeliveryPlans, invalidateDeliveryCache } from '../src/lib/delivery';
import { fetchAlsoViewed, fetchPopularity, invalidateRecommendCache } from '../src/lib/recommend';
import { logAdminAction } from '../src/lib/admin';

const product = (id: string, name = `Product ${id}`) => ({
  id,
  name,
  description: `${name} description`,
  tags: [],
  category: { slug: 'stationery-study' },
  is_active: true,
});

beforeEach(() => {
  for (const k of Object.keys(tableData)) delete tableData[k];
  calls.from = 0;
  calls.rpc = 0;
  invalidateCatalogCache();
  invalidateSettingsCache();
  invalidateDeliveryCache();
  invalidateRecommendCache();
});

describe('catalog read cache', () => {
  it('fetches once for repeat identical product queries', async () => {
    tableData.products = [product('p1'), product('p2')];
    const first = await fetchProducts({ limit: 10 });
    const second = await fetchProducts({ limit: 10 });
    expect(first).toHaveLength(2);
    expect(second).toHaveLength(2);
    expect(calls.from).toBe(1);
  });

  it('keys by query: different options refetch', async () => {
    tableData.products = [product('p1')];
    await fetchProducts({ limit: 1 });
    await fetchProducts({ limit: 2 });
    await fetchProducts({ limit: 1 });
    expect(calls.from).toBe(2);
  });

  it('refetches after invalidateCatalogCache', async () => {
    tableData.products = [product('p1')];
    await fetchProducts();
    invalidateCatalogCache();
    await fetchProducts();
    expect(calls.from).toBe(2);
  });

  it('never caches errors: a failure is followed by a live retry', async () => {
    tableData.products = new Error('db down');
    await expect(fetchProducts()).rejects.toThrow('db down');
    tableData.products = [product('p1')];
    const rows = await fetchProducts();
    expect(rows).toHaveLength(1);
    expect(calls.from).toBe(2);
  });

  it('caches slug, categories, and id lookups (order-preserving)', async () => {
    tableData.products = product('p1');
    await fetchProductBySlug('pen');
    await fetchProductBySlug('pen');
    tableData.categories = [{ id: 'c1', slug: 'stationery-study' }];
    await fetchCategories();
    await fetchCategories();
    tableData.products = [product('b'), product('a')];
    invalidateCatalogCache();
    const ordered = await fetchProductsByIds(['a', 'b']);
    expect(ordered.map((p) => p.id)).toEqual(['a', 'b']);
    await fetchProductsByIds(['a', 'b']);
    // slug(1) + categories(1) + byIds(1)
    expect(calls.from).toBe(3);
  });

  it('still attaches drop products through the cached path', async () => {
    tableData.drops = [{ id: 'd1', title: 'Drop' }];
    tableData.drop_products = [
      { badge: 'HOT', products: product('p1') },
      { badge: 'X', products: null },
    ];
    const drops = await fetchDrops();
    expect(drops[0].products).toHaveLength(1);
    expect(drops[0].products?.[0].badge).toBe('HOT');
    await fetchDrops();
    // drops(1) + drop_products links(1)
    expect(calls.from).toBe(2);
  });
});

describe('settings / delivery read caches', () => {
  it('caches settings and refetches after invalidate', async () => {
    tableData.store_settings = [{ key: 'announcement', value: 'Hi' }];
    const first = await fetchSettings();
    const second = await fetchSettings();
    expect(first.announcement).toBe('Hi');
    expect(second.announcement).toBe('Hi');
    expect(calls.from).toBe(1);
    invalidateSettingsCache();
    await fetchSettings();
    expect(calls.from).toBe(2);
  });

  it('falls back to defaults on error without caching the failure', async () => {
    tableData.store_settings = new Error('db down');
    expect(await fetchSettings()).toEqual(DEFAULT_SETTINGS);
    tableData.store_settings = [{ key: 'announcement', value: 'Back' }];
    expect((await fetchSettings()).announcement).toBe('Back');
    expect(calls.from).toBe(2);
  });

  it('caches delivery plans but never the legacy fallback', async () => {
    tableData.delivery_plans = [
      { key: 'standard', label: 'Standard', eta: '3–5 days', base_fee: '0', rate_per_km: '10', is_active: true, scope: 'all', sort_order: 1 },
    ];
    tableData.delivery_plan_products = [{ plan_key: 'standard', product_id: 'p1' }];
    const plans = await fetchDeliveryPlans(DEFAULT_SETTINGS);
    await fetchDeliveryPlans(DEFAULT_SETTINGS);
    expect(plans[0].products).toEqual(['p1']);
    expect(plans[0].base_fee).toBe(0);
    // plans + links, fetched once
    expect(calls.from).toBe(2);

    invalidateDeliveryCache();
    tableData.delivery_plans = [];
    const legacy = await fetchDeliveryPlans(DEFAULT_SETTINGS);
    expect(legacy.map((p) => p.key)).toEqual(['standard', 'express', 'instant']);
    // fallback derives from live settings, so it must not stick:
    tableData.delivery_plans = [
      { key: 'express', label: 'Express', eta: '1–3 days', base_fee: '50', rate_per_km: '20', is_active: true, scope: 'all', sort_order: 1 },
    ];
    const live = await fetchDeliveryPlans(DEFAULT_SETTINGS);
    expect(live.map((p) => p.key)).toEqual(['express']);
  });
});

describe('recommendation read caches', () => {
  it('caches popularity aggregates per session window', async () => {
    tableData.__rpc = [{ product_id: 'p1', views_30d: 3, carts_30d: 0, wishlists_30d: 0, purchases_30d: 0, score: 3, conversion: 0 }];
    const first = await fetchPopularity();
    const second = await fetchPopularity();
    expect(first.get('p1')?.views_30d).toBe(3);
    expect(second).toBe(first);
    expect(calls.rpc).toBe(1);
  });

  it('caches co-views per product', async () => {
    tableData.__rpc = [{ product_id: 'x' }];
    expect(await fetchAlsoViewed('p1')).toEqual(['x']);
    expect(await fetchAlsoViewed('p1')).toEqual(['x']);
    expect(calls.rpc).toBe(1);
    await fetchAlsoViewed('p2');
    expect(calls.rpc).toBe(2);
  });
});

describe('admin write invalidation', () => {
  it('logAdminAction clears storefront caches so the shop sees the write', async () => {
    tableData.products = [product('p1')];
    await fetchProducts();
    expect(calls.from).toBe(1);
    logAdminAction('product.update', 'products', 'p1', { name: 'New name' });
    // the audit insert itself goes through from(), then the refetch:
    await fetchProducts();
    expect(calls.from).toBe(3);
  });
});
