import { describe, expect, it } from 'vitest';
import { pickRecommendations, scoreCandidate, MAX_RECOMMENDATIONS } from '../src/lib/recommend';
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
    created_at: '',
    ...over,
  } as Product;
}

const viewed = (id: string, tags: string[], views = 1, rank = 0, cat: string | null = 'fashion-accessories') => ({
  id, tags, categorySlug: cat, views, recencyRank: rank,
});

describe('recommendation engine', () => {
  it('never returns more than 6 items and never repeats viewed ones', () => {
    const pool = Array.from({ length: 20 }, (_, i) => product({ id: `p${i}` }));
    const out = pickRecommendations([viewed('p0', ['apparel'])], pool);
    expect(out.length).toBeLessThanOrEqual(MAX_RECOMMENDATIONS);
    expect(out.length).toBeLessThanOrEqual(7);
    expect(out.some((p) => p.id === 'p0')).toBe(false);
  });

  it('prefers shared tags and categories over unrelated items', () => {
    const pool = [
      product({ id: 'same-tags', tags: ['apparel', 'winter'] }),
      product({ id: 'unrelated', tags: ['kitchen'] }),
    ];
    const out = pickRecommendations([viewed('v', ['apparel', 'winter'])], pool);
    expect(out[0].id).toBe('same-tags');
  });

  it('fills with other (trending) products when there is no signal', () => {
    const pool = [
      product({ id: 'hot', is_trending: true }),
      product({ id: 'plain' }),
    ];
    const out = pickRecommendations([], pool);
    expect(out.map((p) => p.id)).toEqual(['hot', 'plain']);
  });

  it('has a gradual slope: 100 views count ~2-3x a single view, never 100x', () => {
    const candidate = product({ id: 'c', tags: ['audio'] });
    const s1 = scoreCandidate([viewed('v', ['audio'], 1)], candidate);
    const s100 = scoreCandidate([viewed('v', ['audio'], 100)], candidate);
    expect(s1).toBeGreaterThan(0);
    expect(s100 / s1).toBeLessThan(3);
  });

  it('stays stable: one extra view does not reshuffle the shelf', () => {
    const pool = [
      product({ id: 'a', tags: ['apparel'] }),
      product({ id: 'b', tags: ['apparel', 'winter'] }),
      product({ id: 'c', tags: ['kitchen'] }),
    ];
    const before = pickRecommendations([viewed('v', ['apparel'], 5)], pool).map((p) => p.id);
    const after = pickRecommendations([viewed('v', ['apparel'], 6)], pool).map((p) => p.id);
    expect(after).toEqual(before);
  });
});
