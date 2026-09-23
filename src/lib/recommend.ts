import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { fetchDrops, fetchProducts, fetchProductsByIds } from './catalog';
import { createTTLCache, registerCache } from './cache';
import { useRecentlyViewed } from '../hooks/useShop';
import type { CartLine, Product } from '../types';

export const MAX_RECOMMENDATIONS = 6;

interface ViewedItem {
  id: string;
  name?: string;
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

/* ═══════════════════ v2: reasoned 60/40 blending ═══════════════════ */

export interface PopularityRow {
  product_id: string;
  views_30d: number;
  carts_30d: number;
  wishlists_30d: number;
  purchases_30d: number;
  score: number;
  conversion: number;
}

export interface RecItem {
  product: Product;
  reason: string;
}

export type RecContext =
  | { kind: 'product'; product: Product }
  | { kind: 'cart'; lines: CartLine[] }
  | { kind: 'category'; categorySlug: string; categoryName: string }
  | { kind: 'browse' };

/** Aggregate popularity (counts only, no customer data). 60s TTL — views and
 * carts land constantly, so a minute-stale score is the honest trade for
 * not re-running the aggregate on every shelf render. */
const popularityCache = createTTLCache<Map<string, PopularityRow>>(60_000);
const alsoViewedCache = createTTLCache<string[]>(60_000);
registerCache(popularityCache);
registerCache(alsoViewedCache);

/** Drop cached popularity/co-view reads (called automatically after admin writes). */
export function invalidateRecommendCache(): void {
  popularityCache.clear();
  alsoViewedCache.clear();
}

export async function fetchPopularity(): Promise<Map<string, PopularityRow>> {
  const hit = popularityCache.get('popularity');
  if (hit) return hit;
  if (!isSupabaseConfigured) return new Map();
  try {
    const { data, error } = await supabase.rpc('product_popularity');
    if (error) throw error;
    const mapped = new Map(((data ?? []) as PopularityRow[]).map((r) => [r.product_id, r]));
    popularityCache.set('popularity', mapped);
    return mapped;
  } catch {
    return new Map();
  }
}

/** Products viewed in the same sessions as this one (aggregate, anonymous). */
export async function fetchAlsoViewed(productId: string): Promise<string[]> {
  const key = `alsoviewed:${productId}`;
  const hit = alsoViewedCache.get(key);
  if (hit) return hit;
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase.rpc('related_by_session', {
      p_product: productId,
      p_limit: 6,
    });
    if (error) throw error;
    const mapped = ((data ?? []) as { product_id: string }[]).map((r) => r.product_id);
    alsoViewedCache.set(key, mapped);
    return mapped;
  } catch {
    return [];
  }
}

/**
 * Blend ~60% personalized with ~40% discovery. The ratio flexes: with no
 * history the shelf is all discovery/popularity; with rich history the
 * personal side fills first and discovery tops it up to `max`.
 */
export function blendRecommendations(opts: {
  viewed: ViewedItem[];
  pool: Product[];
  popularity: Map<string, PopularityRow>;
  alsoViewedIds?: string[];
  dropProductIds?: string[];
  contextName?: string;
  categoryName?: string;
  max?: number;
}): RecItem[] {
  const {
    viewed, pool, popularity,
    alsoViewedIds = [], dropProductIds = [],
    contextName, categoryName, max = MAX_RECOMMENDATIONS,
  } = opts;
  const seen = new Set(viewed.map((v) => v.id));
  const fresh = pool.filter((p) => !seen.has(p.id) && p.is_active !== false);
  const byId = new Map(fresh.map((p) => [p.id, p]));
  const picked: RecItem[] = [];
  const used = new Set<string>();
  const take = (id: string | undefined, reason: string) => {
    if (!id || used.has(id) || seen.has(id)) return false;
    const p = byId.get(id);
    if (!p) return false;
    used.add(id);
    picked.push({ product: p, reason });
    return true;
  };

  const personalTarget = viewed.length > 0 ? Math.ceil(max * 0.6) : 0;

  // 1) Personalized: gradual-score ranking, reasoned by strongest signal.
  const ranked = fresh
    .map((p) => ({ p, s: scoreCandidate(viewed, p) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s);
  for (const { p } of ranked) {
    if (picked.length >= personalTarget) break;
    const sharesCat =
      contextName !== undefined &&
      viewed.some((v) => v.categorySlug && v.categorySlug === p.category?.slug);
    take(
      p.id,
      sharesCat && contextName
        ? `Similar to ${contextName}`
        : viewed[0]?.name
          ? `Because you viewed ${viewed[0].name}`
          : 'Picked for you'
    );
  }

  // 2) Discovery: co-views → live drop → trending → new → popular.
  for (const id of alsoViewedIds) {
    if (picked.length >= max) break;
    take(id, 'People interested in this also viewed');
  }
  const dropSet = new Set(dropProductIds);
  for (const p of fresh) {
    if (picked.length >= max) break;
    if (dropSet.has(p.id)) take(p.id, 'New drop');
  }
  const byPopularity = [...fresh].sort(
    (a, b) => (popularity.get(b.id)?.score ?? 0) - (popularity.get(a.id)?.score ?? 0)
  );
  for (const p of fresh) {
    if (picked.length >= max) break;
    if (p.is_trending) take(p.id, 'Trending now');
  }
  for (const p of fresh) {
    if (picked.length >= max) break;
    if (p.is_new) take(p.id, categoryName ? `New in ${categoryName}` : 'New arrival');
  }
  for (const p of byPopularity) {
    if (picked.length >= max) break;
    const pop = popularity.get(p.id);
    if (pop && (pop.purchases_30d > 0 || pop.carts_30d + pop.wishlists_30d > 0)) {
      take(p.id, categoryName ? `Popular in ${categoryName}` : 'Popular right now');
    }
  }
  // 3) Never return a stub shelf: fill leftovers in pool order.
  for (const p of fresh) {
    if (picked.length >= max) break;
    take(p.id, 'You may also like');
  }
  return picked.slice(0, max);
}

/** One hook for every smart shelf: home, product, cart, category. */
export function useSmartRecommendations(
  context: RecContext,
  max = MAX_RECOMMENDATIONS
): { items: RecItem[]; loading: boolean } {
  const { ids, views } = useRecentlyViewed();
  const [items, setItems] = useState<RecItem[]>([]);
  const [loading, setLoading] = useState(true);

  const contextKey = JSON.stringify(
    context.kind === 'product'
      ? [context.kind, context.product.id]
      : context.kind === 'cart'
        ? [context.kind, context.lines.map((l) => `${l.product.id}:${l.quantity}`).join(',')]
        : context.kind === 'category'
          ? [context.kind, context.categorySlug]
          : [context.kind]
  );

  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      try {
        const ctx: RecContext = JSON.parse(contextKey);
        // Empty bag + no history = nothing to pair: skip all network.
        if (ctx.kind === 'cart' && ctx.lines.length === 0 && ids.length === 0) {
          if (live) {
            setItems([]);
            setLoading(false);
          }
          return;
        }
        const [seenProducts, pool, popularity, drops] = await Promise.all([
          fetchProductsByIds(ids),
          fetchProducts({ limit: 80 }),
          fetchPopularity(),
          fetchDrops('monthly', 'active').catch(() => []),
        ]);
        if (!live) return;
        const byId = new Map(seenProducts.map((p) => [p.id, p]));
        const viewed: ViewedItem[] = ids
          .map((id, i) => {
            const p = byId.get(id);
            if (!p) return null;
            return {
              id,
              name: p.name,
              tags: p.tags ?? [],
              categorySlug: p.category?.slug ?? null,
              views: views[id] ?? 1,
              recencyRank: i,
            };
          })
          .filter((v): v is ViewedItem & { name: string } => v !== null);

        // Context contributes pseudo-history so anonymous users still get
        // relevant picks (never pretending to know them).
        let contextViewed = viewed;
        let contextName: string | undefined;
        let categoryName: string | undefined;
        let alsoViewed: string[] = [];
        if (ctx.kind === 'product') {
          contextName = ctx.product.name;
          alsoViewed = await fetchAlsoViewed(ctx.product.id);
          contextViewed = [
            {
              id: ctx.product.id,
              name: ctx.product.name,
              tags: ctx.product.tags ?? [],
              categorySlug: ctx.product.category?.slug ?? null,
              views: 2,
              recencyRank: 0,
            },
            ...viewed.map((v, i) => ({ ...v, recencyRank: i + 1 })),
          ];
        } else if (ctx.kind === 'cart') {
          contextViewed = [
            ...ctx.lines.map((l, i) => ({
              id: l.product.id,
              name: l.product.name,
              tags: l.product.tags ?? [],
              categorySlug: l.product.category?.slug ?? null,
              views: 1 + Math.min(2, l.quantity),
              recencyRank: i,
            })),
            ...viewed.map((v, i) => ({ ...v, recencyRank: i + ctx.lines.length })),
          ];
        } else if (ctx.kind === 'category') {
          categoryName = ctx.categoryName;
        }

        const dropIds = drops.flatMap((d) => (d.products ?? []).map((p) => p.id));
        setItems(
          blendRecommendations({
            viewed: contextViewed,
            pool,
            popularity,
            alsoViewedIds: alsoViewed,
            dropProductIds: dropIds,
            contextName,
            categoryName,
            max,
          }).filter((r) =>
            ctx.kind === 'product' ? r.product.id !== (ctx as { product: Product }).product.id : true
          )
        );
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
  }, [contextKey, ids.join('|'), max]);

  return { items, loading };
}
