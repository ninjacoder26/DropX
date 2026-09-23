import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCategories, fetchProducts } from '../lib/catalog';
import type { Category, Product } from '../types';
import { ProductGrid } from '../components/product';
import { Button, EmptyState, ErrorState, Skeleton } from '../components/ui';
import { usePageTitle } from '../hooks/usePageTitle';

export default function CollectionsPage() {
  usePageTitle('Collections');
  const [cats, setCats] = useState<Category[]>([]);
  const [byCat, setByCat] = useState<Record<string, Product[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setLoadError(null);
    (async () => {
      const c = await fetchCategories().catch((e: unknown) => {
        throw e instanceof Error ? e : new Error('Could not load collections.');
      });
      setCats(c);
      const entries = await Promise.all(
        c.map(async (cat) => {
          const p = await fetchProducts({ categorySlug: cat.slug, limit: 4 }).catch(() => [] as Product[]);
          return [cat.slug, p] as const;
        })
      );
      setByCat(Object.fromEntries(entries));
      setLoading(false);
    })().catch((e: unknown) => {
      setLoadError(e instanceof Error ? e.message : 'Could not load collections.');
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="dx-full py-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ember">Curated edits</p>
      <h1 className="mt-1 font-display text-3xl font-black tracking-tight sm:text-4xl">Collections</h1>
      <p className="mt-1 text-sm text-ink/60">Curated edits across every category.</p>
      {loading ? (
        <div className="mt-6 space-y-4"><Skeleton className="h-40" /><Skeleton className="h-40" /></div>
      ) : loadError ? (
        <div className="mt-6"><ErrorState message={loadError} onRetry={load} /></div>
      ) : cats.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No collections yet"
            body="Curated edits are on the way — browse the full shop meanwhile."
            action={<Link to="/shop"><Button>Browse the shop</Button></Link>}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-12">
          {cats.map((c) => (
            <section key={c.id}>
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="font-display text-2xl font-black">{c.name}</h2>
                  <p className="text-sm text-ink/60">{c.description}</p>
                </div>
                <Link to={`/shop?category=${c.slug}`} className="text-sm font-bold text-ember hover:underline">View all</Link>
              </div>
              <div className="mt-4">
                {(byCat[c.slug]?.length ?? 0) === 0 ? (
                  <p className="text-sm text-ink/50">Coming soon.</p>
                ) : (
                  <ProductGrid products={byCat[c.slug]} />
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
