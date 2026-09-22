import { describe, expect, it } from 'vitest';
import { normalizeQuery } from '../src/lib/analytics';
import { blendRecommendations } from '../src/lib/recommend';
import type { Product } from '../src/types';

function product(over: Partial<Product> & { id: string }): Product {
  return {
    name: over.id,
    slug: over.id,
    description: '',
    category_id: null,
    base_price: 100,
    compare_at_price: null,
    currency: 'NPR',
    is_active: true,
    is_featured: false,
    is_trending: false,
    is_new: false,
    rating_avg: 0,
    rating_count: 0,
    total_sold: 0,
    tags: [],
    brand: '',
    specs: {},
    created_at: '',
    ...over,
  } as Product;
}

describe('query normalization', () => {
  it('merges case/spacing variants into one demand', () => {
    expect(normalizeQuery('  Blue HOODIE  ')).toBe('blue hoodie');
    expect(normalizeQuery('a')).toBe('a');
  });
});

describe('60/40 blending', () => {
  const pool = [
    product({ id: 'p1', tags: ['apparel'], category: { id: 'c1', name: 'F', slug: 'fashion-accessories', description: '', parent_id: null, sort_order: 1, is_active: true } as Product['category'] }),
    product({ id: 'p2', tags: ['apparel'] }),
    product({ id: 'hot', is_trending: true }),
    product({ id: 'fresh', is_new: true }),
    product({ id: 'plain' }),
  ];
  const viewed = [{ id: 'v', name: 'Viewed Tee', tags: ['apparel'], categorySlug: null, views: 3, recencyRank: 0 }];

  it('fills ~60% personal then tops up with discovery, max 6', () => {
    const out = blendRecommendations({ viewed, pool, popularity: new Map(), max: 6 });
    expect(out.length).toBeLessThanOrEqual(6);
    expect(out.length).toBeGreaterThan(0);
    const reasons = out.map((r) => r.reason);
    expect(reasons.some((r) => /viewed|Similar|Picked/.test(r))).toBe(true);
    expect(reasons.some((r) => /Trending|New|Popular|also|drop/i.test(r))).toBe(true);
  });

  it('never repeats the viewed item or duplicates', () => {
    const pool2 = [product({ id: 'v', tags: ['apparel'] }), product({ id: 'x' })];
    const out = blendRecommendations({ viewed, pool: pool2, popularity: new Map(), max: 6 });
    const ids = out.map((r) => r.product.id);
    expect(ids).not.toContain('v');
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('anonymous users get discovery, never fake personalization', () => {
    const out = blendRecommendations({ viewed: [], pool, popularity: new Map(), max: 4 });
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((r) => !/Because you viewed/.test(r.reason))).toBe(true);
  });

  it('labels co-views and drops honestly', () => {
    const out = blendRecommendations({
      viewed: [],
      pool,
      popularity: new Map(),
      alsoViewedIds: ['plain'],
      dropProductIds: ['fresh'],
      max: 6,
    });
    const byId = new Map(out.map((r) => [r.product.id, r.reason]));
    expect(byId.get('plain')).toBe('People interested in this also viewed');
    expect(byId.get('fresh')).toBe('New drop');
  });
});
