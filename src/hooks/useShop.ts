import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { logWishlistAdd } from '../lib/analytics';
import { safeGet, safeSet } from '../lib/storage';
import { useAuth } from '../store/AuthContext';

/** Wishlist (server when logged in, localStorage fallback for guests). */
export function useWishlist() {
  const { user } = useAuth();
  const [ids, setIds] = useState<string[]>(() => safeGet<string[]>('dropx-wishlist', []));

  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;
    supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setIds(data.map((r: { product_id: string }) => r.product_id));
      });
  }, [user]);

  useEffect(() => {
    if (!user) safeSet('dropx-wishlist', ids);
  }, [ids, user]);

  const toggle = useCallback(
    async (productId: string, categoryId?: string | null) => {
      const has = ids.includes(productId);
      setIds((prev) => (has ? prev.filter((x) => x !== productId) : [...prev, productId]));
      if (!has) logWishlistAdd(user?.id ?? null, productId, categoryId ?? null);
      if (user && isSupabaseConfigured) {
        if (has) await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', productId);
        else await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId });
      }
    },
    [ids, user]
  );

  return { ids, toggle, has: (id: string) => ids.includes(id) };
}

/** Recently viewed products (local only), with per-product view counts. */
export function useRecentlyViewed() {
  const [ids, setIds] = useState<string[]>(() => safeGet<string[]>('dropx-recent', []));
  const [views, setViews] = useState<Record<string, number>>(() => safeGet<Record<string, number>>('dropx-views', {}));

  useEffect(() => {
    safeSet('dropx-recent', ids);
  }, [ids]);

  useEffect(() => {
    safeSet('dropx-views', views);
  }, [views]);

  const push = useCallback((id: string) => {
    setIds((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 8));
    setViews((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }, []);

  return { ids, views, push };
}
