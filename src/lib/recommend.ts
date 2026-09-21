import { useEffect, useState } from 'react';
import { fetchProducts, fetchProductsByIds } from './catalog';
import { useRecentlyViewed } from '../hooks/useShop';
import type { Product } from '../types';

export const MAX_RECOMMENDATIONS = 6;

interface ViewedItem {
  id: string;
  tags: string[];
  categorySlug: string | null;
  views: number;
  recencyRank: number; // 0 = most recently viewed
}

/**
 * Gradual-slope scoring. Every influence saturates instead of spiking:
 * - repeat views help logarithmically (view 100 counts ~2.4x view 1, not 100x)
 * - recency decays gently: 1 / (1 + 0.15 × rank)
 * - shared tags +2 each, same category +1, capped per viewed item
 * Result: suggestions evolve smoothly as you browse; no single view
 * hijacks the whole shelf. Unseen trending/new items fill the rest so
 * the shelf always shows other products too.
 */
export function scoreCandidate(viewed: ViewedItem[], candidate: Product): number {
  const cTags = new Set((candidate.tags ?? []).map((t) => t.toLowerCase()));
  const cCat = candidate.category?.slug ?? null;
  let score = 0;
  for (const v of viewed) {
    if (v.id === candidate.id) continue;
    const viewWeight = 1 + Math.log1p(v.views) / Math.log(11); // 1 → ~2.4 at 100 views
    const recency = 1 / (1 + 0.15 * v.recencyRank);
    let shared = 0;
    for (const t of v.tags) {
      if (cTags.has(t.toLowerCase())) shared += 1;
    }
    const catBonus = v.categorySlug && v.categorySlug === cCat ? 1 : 0;
    score += Math.min(2 * shared + catBonus, 7) * viewWeight * recency;
  }
  return score;
}

export function pickRecommendations(
  viewed: ViewedItem[],
  pool: Product[],
  max = MAX_RECOMMENDATIONS
): Product[] {
  const seen = new Set(viewed.map((v) => v.id));
  const fresh = pool.filter((p) => !seen.has(p.id) && p.is_active !== false);
  const ranked = fresh
    .map((p) => ({ p, s: scoreCandidate(viewed, p) }))
    .sort((a, b) => b.s - a.s || Number(b.p.is_trending) - Number(a.p.is_trending));
  // Scored matches first, then trending/new unseen items so the shelf
  // always mixes "for you" picks with other discoveries.
  const scored = ranked.filter((r) => r.s > 0).map((r) => r.p);
  const filler = ranked.filter((r) => r.s === 0).map((r) => r.p);
  return [...scored, ...filler].slice(0, max);
}

/** Reactive hook: needs view history + a candidate pool from the catalog. */
export function useRecommendations(max = MAX_RECOMMENDATIONS): {
  items: Product[];
  loading: boolean;
} {
  const { ids, views } = useRecentlyViewed();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      try {
        const [seenProducts, pool] = await Promise.all([
          fetchProductsByIds(ids),
          fetchProducts({ limit: 60 }),
        ]);
        if (!live) return;
        const byId = new Map(seenProducts.map((p) => [p.id, p]));
        const viewed: ViewedItem[] = ids
          .map((id, i) => {
            const p = byId.get(id);
            if (!p) return null;
            return {
              id,
              tags: p.tags ?? [],
              categorySlug: p.category?.slug ?? null,
              views: views[id] ?? 1,
              recencyRank: i,
            };
          })
          .filter((v): v is ViewedItem => v !== null);
        setItems(pickRecommendations(viewed, pool, max));
      } catch {
        if (live) setItems([]);
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join('|'), max]);

  return { items, loading };
}
