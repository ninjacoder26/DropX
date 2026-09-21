import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
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
    async (productId: string) => {
      const has = ids.includes(productId);
      setIds((prev) => (has ? prev.filter((x) => x !== productId) : [...prev, productId]));
      if (user && isSupabaseConfigured) {
        if (has) await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', productId);
        else await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId });
      }
    },
    [ids, user]
  );

  return { ids, toggle, has: (id: string) => ids.includes(id) };
}

/** Recently viewed products (local only). */
export function useRecentlyViewed() {
  const [ids, setIds] = useState<string[]>(() => safeGet<string[]>('dropx-recent', []));

  useEffect(() => {
    safeSet('dropx-recent', ids);
  }, [ids]);

  const push = useCallback((id: string) => {
    setIds((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 8));
  }, []);

  return { ids, push };
}
