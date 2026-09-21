import { supabase, isSupabaseConfigured } from './supabase';
import type { Category, Drop, DropState, Product } from '../types';
import { dropState } from '../types';
import { TAG_VOCABULARY } from './tags';

const PRODUCT_SELECT = `
  *,
  category:categories (*),
  images:product_images (*),
  variants:product_variants (*)
`;

export async function fetchProducts(opts?: {
  categorySlug?: string;
  search?: string;
  sort?: 'new' | 'price-asc' | 'price-desc' | 'popular';
  trending?: boolean;
  isNew?: boolean;
  featured?: boolean;
  limit?: number;
}): Promise<Product[]> {
  if (!isSupabaseConfigured) return [];
  // A search term that exactly matches a tag (e.g. "audio") also matches
  // tagged products — PostgREST can't ilike inside arrays, so we fetch
  // broadly once and filter client-side in that case.
  const tagHit =
    opts?.search && (TAG_VOCABULARY as readonly string[]).includes(opts.search.trim().toLowerCase())
      ? opts.search.trim().toLowerCase()
      : null;
  let q = supabase.from('products').select(PRODUCT_SELECT).eq('is_active', true);
  if (opts?.trending) q = q.eq('is_trending', true);
  if (opts?.isNew) q = q.eq('is_new', true);
  if (opts?.featured) q = q.eq('is_featured', true);
  if (opts?.search && !tagHit) {
    const term = opts.search.replace(/[%(),]/g, '').slice(0, 60);
    q = q.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }
  if (opts?.sort === 'price-asc') q = q.order('base_price', { ascending: true });
  else if (opts?.sort === 'price-desc') q = q.order('base_price', { ascending: false });
  else if (opts?.sort === 'popular') q = q.order('total_sold', { ascending: false });
  else q = q.order('created_at', { ascending: false });
  if (opts?.limit) q = q.limit(opts.limit);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  let rows = (data ?? []) as unknown as Product[];
  if (opts?.categorySlug) rows = rows.filter((p) => p.category?.slug === opts.categorySlug);
  if (tagHit) {
    const term = (opts?.search ?? '').trim().toLowerCase();
    rows = rows.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        (p.tags ?? []).map((t) => t.toLowerCase()).includes(tagHit)
    );
  }
  return rows;
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  if (error) return null;
  return data as unknown as Product;
}

export async function fetchCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw new Error(error.message);
  return (data ?? []) as Category[];
}

export async function fetchDrops(kind?: 'monthly' | 'mega', status?: DropState | 'not-ended'): Promise<Drop[]> {
  if (!isSupabaseConfigured) return [];
  let q = supabase.from('drops').select('*').eq('is_published', true).order('starts_at', { ascending: false });
  if (kind) q = q.eq('kind', kind);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  let drops = (data ?? []) as Drop[];
  // Storefront rule: a drop only "shows" when it is published (enabled) AND
  // within its date window. Drafts never leave the admin dashboard.
  if (status === 'not-ended') drops = drops.filter((d) => dropState(d) !== 'ended');
  else if (status) drops = drops.filter((d) => dropState(d) === status);
  // Attach products per drop
  for (const d of drops) {
    const { data: links } = await supabase
      .from('drop_products')
      .select('badge, sort_order, products:product_id (' + PRODUCT_SELECT + ')')
      .eq('drop_id', d.id)
      .order('sort_order');
    d.products = ((links ?? []) as unknown as Array<{ badge: string; products: Product }>)
      .filter((l) => l.products)
      .map((l) => ({ ...l.products, badge: l.badge }));
  }
  return drops;
}

export async function fetchDropBySlug(slug: string): Promise<Drop | null> {
  const drops = await fetchDrops();
  return drops.find((d) => d.slug === slug) ?? null;
}

/** Recently-viewed support: fetch specific products by id, newest-first. */
export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (!isSupabaseConfigured || ids.length === 0) return [];
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .in('id', ids.slice(0, 8))
    .eq('is_active', true);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as Product[];
  const order = new Map(ids.map((id, i) => [id, i]));
  return rows.sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
}
