import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Product } from '../types';
import { useWishlist } from '../hooks/useShop';
import { useCart } from '../store/CartContext';
import { formatNPR } from '../lib/shop';
import { Badge, Button, EmptyState, PageHeader, Skeleton } from '../components/ui';
import { usePageTitle } from '../hooks/usePageTitle';

export default function WishlistPage() {
  const { ids, toggle } = useWishlist();
  const { add } = useCart();
  usePageTitle('Wishlist');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || ids.length === 0) {
      setLoading(false);
      setProducts([]);
      return;
    }
    setLoading(true);
    supabase
      .from('products')
      .select('*, category:categories(*), images:product_images(*), variants:product_variants(*)')
      .in('id', ids)
      .eq('is_active', true)
      .then(({ data }) => {
        const rows = (data ?? []) as unknown as Product[];
        const order = new Map(ids.map((id, i) => [id, i]));
        rows.sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
        setProducts(rows);
        setLoading(false);
      }, () => setLoading(false));
  }, [ids]);

  const quickAdd = (p: Product) => {
    const v = (p.variants ?? []).filter((x) => x.is_active).find((x) => x.stock > 0) ?? null;
    if (!v) return;
    void add(p, v, 1).then(() => {
      setAddedId(p.id);
      setTimeout(() => setAddedId((cur) => (cur === p.id ? null : cur)), 2000);
    });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <PageHeader title={`Wishlist (${ids.length})`} sub="Saved for later — prices and stock are live." />
      {loading ? (
        <div className="mt-6 space-y-2">
          <Skeleton className="h-[76px]" /><Skeleton className="h-[76px]" /><Skeleton className="h-[76px]" />
        </div>
      ) : products.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Nothing saved yet"
            body="Tap the heart on any product to keep it here for later."
            action={<Link to="/shop"><Button>Discover products</Button></Link>}
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {products.map((p) => {
            const first = (p.images ?? []).filter((im) => !im.is_hidden).sort(
              (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order
            )[0];
            const inStock = (p.variants ?? []).some((v) => v.is_active && v.stock > 0);
            return (
              <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card ring-1 ring-ink/5">
                <Link to={`/product/${p.slug}`} className="shrink-0" aria-label={p.name}>
                  {first ? (
                    <img src={first.secure_url} alt="" loading="lazy" className="h-16 w-16 rounded-xl object-cover ring-1 ring-ink/10" />
                  ) : (
                    <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-paper-dark font-display text-lg font-black text-ink/30">
                      {(p.name.trim()[0] ?? 'D').toUpperCase()}
                    </span>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/product/${p.slug}`} className="block truncate text-sm font-bold hover:text-ember">
                    {p.name}
                  </Link>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-ink/50">
                    <span className="font-display text-sm font-extrabold text-ink">{formatNPR(p.base_price)}</span>
                    {inStock ? <Badge tone="green">in stock</Badge> : <Badge tone="red">sold out</Badge>}
                  </p>
                </div>
                {inStock && (
                  <button
                    onClick={() => quickAdd(p)}
                    aria-label={`Add ${p.name} to bag`}
                    className="shrink-0 rounded-full bg-ink p-2.5 text-paper transition hover:bg-ember"
                  >
                    <ShoppingBag size={15} />
                  </button>
                )}
                {addedId === p.id && <span className="shrink-0 text-[11px] font-bold text-ember">Added!</span>}
                <button
                  onClick={() => void toggle(p.id, p.category_id ?? null)}
                  aria-label={`Remove ${p.name} from wishlist`}
                  className="shrink-0 rounded-full p-2 text-ink/40 transition hover:bg-red-50 hover:text-red-600"
                >
                  <X size={15} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {!loading && products.length > 0 && (
        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-ink/50">
          <Heart size={12} className="text-ember" /> Saved items stay here on this device — sign in to sync them everywhere.
        </p>
      )}
    </div>
  );
}
