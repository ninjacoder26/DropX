import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useStoreSettings } from '../lib/settings';
import { logCartAdd } from '../lib/analytics';
import { safeGet, safeRemove, safeSet } from '../lib/storage';
import { useAuth } from './AuthContext';
import type { CartLine, Product, ProductVariant } from '../types';

interface LocalItem {
  product_id: string;
  variant_id: string | null;
  quantity: number;
  product: Product;
  variant: ProductVariant | null;
}

interface CartState {
  lines: CartLine[];
  count: number;
  subtotal: number;
  loading: boolean;
  add: (product: Product, variant: ProductVariant | null, qty?: number) => Promise<void>;
  setQty: (productId: string, variantId: string | null, qty: number) => Promise<void>;
  remove: (productId: string, variantId: string | null) => Promise<void>;
  clear: () => Promise<void>;
}

const Ctx = createContext<CartState | null>(null);
const LS_KEY = 'dropx-cart-v1';

function unitPrice(p: Product, v: ProductVariant | null): number {
  return Number(p.base_price) + Number(v?.price_adjustment ?? 0);
}

function loadLocal(): LocalItem[] {
  return safeGet<LocalItem[]>(LS_KEY, []);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { maxQtyPerItem: maxQty } = useStoreSettings();
  const [items, setItemsState] = useState<LocalItem[]>(() => loadLocal());
  const [loading, setLoading] = useState(false);
  // Ref mirror so rapid consecutive updates (double-click quick-add) never
  // act on a stale closure — every mutation reads the latest lines.
  const itemsRef = useRef(items);
  const setItems = useCallback((next: LocalItem[]) => {
    itemsRef.current = next;
    setItemsState(next);
  }, []);

  // Persist guest cart
  useEffect(() => {
    if (!user) safeSet(LS_KEY, items);
  }, [items, user]);

  // Load server cart on login
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('cart_items')
        .select('product_id, variant_id, quantity, products:product_id (*), variants:variant_id (*)')
        .eq('user_id', user.id);
      if (data && data.length > 0) {
        const mapped: LocalItem[] = (data as unknown as Array<{
          product_id: string; variant_id: string | null; quantity: number;
          products: Product; variants: ProductVariant | null;
        }>)
          .filter((r) => r.products)
          .map((r) => ({
            product_id: r.product_id,
            variant_id: r.variant_id,
            quantity: Math.min(maxQty, r.quantity),
            product: r.products,
            variant: r.variants,
          }));
        // Merge guest lines in (reads the live ref, not a stale closure)
        const merged = [...mapped];
        for (const g of itemsRef.current) {
          const f = merged.find(
            (m) => m.product_id === g.product_id && (m.variant_id ?? null) === (g.variant_id ?? null)
          );
          if (f) f.quantity = Math.min(maxQty, f.quantity + g.quantity);
          else merged.push({ ...g, quantity: Math.min(maxQty, g.quantity) });
        }
        setItems(merged);
        safeRemove(LS_KEY);
      }
      setLoading(false);
    })();
  }, [user]);

  // The cap can land after the cart (settings fetch first, live value after):
  // shrink anything over it. place_order() enforces the same cap server-side.
  useEffect(() => {
    const over = itemsRef.current.some((i) => i.quantity > maxQty);
    if (over) setItems(itemsRef.current.map((i) => (i.quantity > maxQty ? { ...i, quantity: maxQty } : i)));
  }, [maxQty, setItems]);

  const syncServer = useCallback(
    async (next: LocalItem[]) => {
      if (!user || !isSupabaseConfigured) return;
      await supabase.from('cart_items').delete().eq('user_id', user.id);
      if (next.length === 0) return;
      await supabase.from('cart_items').insert(
        next.map((i) => ({
          user_id: user.id,
          product_id: i.product_id,
          variant_id: i.variant_id,
          quantity: i.quantity,
        }))
      );
    },
    [user]
  );

  const add = useCallback(
    async (product: Product, variant: ProductVariant | null, qty = 1) => {
      const prev = itemsRef.current;
      const key = (p: string, v: string | null) => `${p}::${v ?? ''}`;
      const found = prev.find((i) => key(i.product_id, i.variant_id) === key(product.id, variant?.id ?? null));
      const next: LocalItem[] = found
        ? prev.map((i) => (i === found ? { ...i, quantity: Math.min(maxQty, i.quantity + qty) } : i))
        : [
            ...prev,
            {
              product_id: product.id,
              variant_id: variant?.id ?? null,
              quantity: Math.min(maxQty, Math.max(1, qty)),
              product,
              variant,
            },
          ];
      setItems(next);
      logCartAdd(user?.id ?? null, product.id, product.category_id, qty);
      await syncServer(next);
    },
    [syncServer, setItems, user, maxQty]
  );

  const setQty = useCallback(
    async (productId: string, variantId: string | null, qty: number) => {
      const prev = itemsRef.current;
      const next =
        qty <= 0
          ? prev.filter((i) => !(i.product_id === productId && (i.variant_id ?? null) === (variantId ?? null)))
          : prev.map((i) =>
              i.product_id === productId && (i.variant_id ?? null) === (variantId ?? null)
                ? { ...i, quantity: Math.min(maxQty, qty) }
                : i
            );
      setItems(next);
      await syncServer(next);
    },
    [syncServer, setItems, maxQty]
  );

  const remove = useCallback(
    async (productId: string, variantId: string | null) => {
      await setQty(productId, variantId, 0);
    },
    [setQty]
  );

  const clear = useCallback(async () => {
    setItems([]);
    if (user && isSupabaseConfigured) {
      await supabase.from('cart_items').delete().eq('user_id', user.id);
    }
    safeRemove(LS_KEY);
  }, [user, setItems]);

  const value = useMemo<CartState>(() => {
    const lines: CartLine[] = items.map((i) => ({
      product: i.product,
      variant: i.variant,
      quantity: i.quantity,
      unitPrice: unitPrice(i.product, i.variant),
    }));
    return {
      lines,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      subtotal: lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0),
      loading,
      add,
      setQty,
      remove,
      clear,
    };
  }, [items, loading, add, setQty, remove, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCart must be used inside CartProvider');
  return v;
}
