import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Product } from '../types';
import { useWishlist } from '../hooks/useShop';
import { ProductGrid, GRID_COMPACT } from '../components/product';
import { EmptyState, Skeleton } from '../components/ui';

export default function WishlistPage() {
  const { ids } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || ids.length === 0) {
      setLoading(false);
      setProducts([]);
      return;
    }
    supabase
      .from('products')
      .select('*, category:categories(*), images:product_images(*), variants:product_variants(*)')
      .in('id', ids)
      .eq('is_active', true)
      .then(({ data }) => {
        setProducts((data ?? []) as unknown as Product[]);
        setLoading(false);
      });
  }, [ids]);

  return (
    <div className="dx-full py-8">
      <h1 className="font-display text-3xl font-black">Wishlist ({ids.length})</h1>
      {loading ? (
        <div className={`mt-6 ${GRID_COMPACT}`}>
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-square" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Nothing saved yet"
            body="Tap the heart on any product to keep it here for later."
            action={<Link to="/shop" className="rounded-full bg-ember px-6 py-2.5 text-sm font-bold text-white">Discover products</Link>}
          />
        </div>
      ) : (
        <div className="mt-6"><ProductGrid products={products} /></div>
      )}
    </div>
  );
}
