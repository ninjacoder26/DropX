import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { clsx } from 'clsx';
import { fetchCategories, fetchProducts } from '../lib/catalog';
import { isSupabaseConfigured } from '../lib/supabase';
import { SetupNotice } from '../components/layout';
import type { Category, Product } from '../types';
import { ProductGrid } from '../components/product';
import { usePageTitle } from '../hooks/usePageTitle';
import { EmptyState, ErrorState, Input, Skeleton } from '../components/ui';

type Sort = 'new' | 'price-asc' | 'price-desc' | 'popular';

export default function ShopPage() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const category = params.get('category') ?? '';
  const q = params.get('q') ?? '';
  const tag = params.get('tag') ?? '';
  const sort = (params.get('sort') as Sort) || 'new';
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [localQ, setLocalQ] = useState(q);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const title = q ? `Results for “${q}”` : category ? cats.find((c) => c.slug === category)?.name ?? 'Shop' : 'Shop all';
  usePageTitle(title);

  useEffect(() => {
    setLocalQ(q);
  }, [q]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [p, c] = await Promise.all([
          fetchProducts({
            categorySlug: category || undefined,
            search: q || undefined,
            sort,
            limit: 60,
          }),
          fetchCategories(),
        ]);
        setProducts(p);
        setCats(c);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load products.');
      } finally {
        setLoading(false);
      }
    })();
  }, [category, q, sort]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (tag && !(p.tags ?? []).map((t) => t.toLowerCase()).includes(tag.toLowerCase())) return false;
      const price = Number(p.base_price);
      if (price > maxPrice) return false;
      if (inStockOnly) {
        const stock = (p.variants ?? []).reduce((s, v) => s + v.stock, 0);
        if ((p.variants?.length ?? 0) > 0 && stock <= 0) return false;
      }
      return true;
    });
  }, [products, maxPrice, inStockOnly, tag]);

  const availableTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      for (const t of p.tags ?? []) {
        const k = t.toLowerCase();
        counts.set(k, (counts.get(k) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }, [products]);

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next);
  };

  return (
    <div className="dx-full py-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ember">Catalog</p>
      <h1 className="mt-1 font-display text-3xl font-black tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="mt-1 text-sm text-ink/60">{filtered.length} product{filtered.length === 1 ? '' : 's'}</p>
      {availableTags.length > 0 && (
        <div className="no-scrollbar -mx-4 mt-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter by tag">
          {tag && (
            <button
              onClick={() => set('tag', '')}
              className="shrink-0 rounded-full bg-ink px-3.5 py-1.5 text-xs font-bold text-paper"
            >
              #{tag} ✕
            </button>
          )}
          {availableTags.filter((t) => t !== tag.toLowerCase()).map((t) => (
            <button
              key={t}
              onClick={() => set('tag', t)}
              className="shrink-0 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-ink/70 ring-1 ring-ink/10 transition hover:ring-ink/30"
            >
              #{t}
            </button>
          ))}
        </div>
      )}
      {!isSupabaseConfigured && (
        <div className="mt-4"><SetupNotice area="product catalog" /></div>
      )}
      {/* Mobile filter toggle */}
      <button
        onClick={() => setFiltersOpen(!filtersOpen)}
        aria-expanded={filtersOpen}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-bold lg:hidden"
      >
        <SlidersHorizontal size={15} /> {filtersOpen ? 'Hide filters' : 'Show filters'}
      </button>

      <div className="mt-4 grid gap-6 lg:mt-6 lg:grid-cols-[240px_1fr]">
        {/* Filters */}
        <aside className={clsx('h-fit rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink/5 lg:sticky lg:top-32', !filtersOpen && 'hidden lg:block')}>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink/50">
            <SlidersHorizontal size={14} /> Filters
          </p>
          <div className="mt-4 space-y-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                set('q', localQ.trim());
              }}
            >
              <Input value={localQ} onChange={(e) => setLocalQ(e.target.value)} placeholder="Search…" aria-label="Search products" />
            </form>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink/60">Category</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  onClick={() => set('category', '')}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${!category ? 'bg-ink text-paper' : 'bg-ink/5 hover:bg-ink/10'}`}
                >
                  All
                </button>
                {cats.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => set('category', c.slug)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${category === c.slug ? 'bg-ink text-paper' : 'bg-ink/5 hover:bg-ink/10'}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink/60">Sort</p>
              <select
                value={sort}
                onChange={(e) => set('sort', e.target.value)}
                className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
                aria-label="Sort products"
              >
                <option value="new">Newest</option>
                <option value="popular">Most popular</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink/60">
                Max price: NPR {maxPrice.toLocaleString('en-NP')}
              </p>
              <input
                type="range"
                min={500}
                max={10000}
                step={100}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="mt-2 w-full accent-[#F06427]"
                aria-label="Maximum price"
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="h-4 w-4 accent-[#F06427]" />
              In stock only
            </label>
          </div>
        </aside>

        {/* Grid */}
        <div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="aspect-square" />)}
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={() => window.location.reload()} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No products found"
              body="Try a different search, category, or price range."
              action={<button onClick={() => { setParams({}); setMaxPrice(10000); setInStockOnly(false); }} className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper">Clear filters</button>}
            />
          ) : (
            <ProductGrid products={filtered} />
          )}
        </div>
      </div>
    </div>
  );
}
