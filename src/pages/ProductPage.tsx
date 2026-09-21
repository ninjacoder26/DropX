import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Heart, Minus, Plus, Share2, ShieldCheck, ShoppingBag, Star, Truck } from 'lucide-react';
import { clsx } from 'clsx';
import { fetchProductBySlug } from '../lib/catalog';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useRecommendations } from '../lib/recommend';
import { usePageTitle } from '../hooks/usePageTitle';
import type { Product, ProductVariant, Review } from '../types';
import { useCart } from '../store/CartContext';
import { useAuth } from '../store/AuthContext';
import { useRecentlyViewed, useWishlist } from '../hooks/useShop';
import { cloudinaryThumb, discountPct, formatNPR } from '../lib/shop';
import { Badge, Button, EmptyState, Skeleton } from '../components/ui';
import { useStoreSettings } from '../lib/settings';
import { ProductGrid, primaryImage, specLabel, srcSetFor } from '../components/product';

export default function ProductPage() {
  const { slug = '' } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const { items: recommended } = useRecommendations(6);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [added, setAdded] = useState(false);
  const [shared, setShared] = useState(false);
  usePageTitle(product?.name ?? 'Product');
  const { add } = useCart();
  const { user } = useAuth();
  const { has, toggle } = useWishlist();
  const { push } = useRecentlyViewed();
  const { profitMargin } = useStoreSettings();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setNotFound(false);
      const p = await fetchProductBySlug(slug);
      if (!p) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProduct(p);
      push(p.id);
      const active = (p.variants ?? []).filter((v) => v.is_active);
      setVariant(active.find((v) => v.stock > 0) ?? active[0] ?? null);
      setQty(1);
      setImgIdx(0);
      if (isSupabaseConfigured) {
        const { data } = await supabase
          .from('reviews')
          .select('*')
          .eq('product_id', p.id)
          .eq('is_approved', true)
          .order('created_at', { ascending: false })
          .limit(10);
        setReviews((data ?? []) as Review[]);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const images = useMemo(() => {
    if (!product?.images?.length) return [];
    return [...product.images].sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order
    );
  }, [product]);

  const unit = product ? Number(product.base_price) + Number(variant?.price_adjustment ?? 0) : 0;
  const pct = product ? discountPct(unit, product.compare_at_price ? Number(product.compare_at_price) : null) : null;
  const out = variant ? variant.stock <= 0 : (product?.variants?.length ?? 0) > 0;
  const wished = product ? has(product.id) : false;

  if (loading) {
    return (
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:grid-cols-2">
        <Skeleton className="aspect-square" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <EmptyState
          title="Product not found"
          body="This product may be sold out, hidden, or the link is wrong."
          action={<Link to="/shop" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper">Back to shop</Link>}
        />
      </div>
    );
  }

  return (
    <div className="dx-full py-8">
      <nav className="text-xs text-ink/50" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-ember">Home</Link> /{' '}
        <Link to="/shop" className="hover:text-ember">Shop</Link> /{' '}
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="mt-4 grid gap-8 md:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-ink/5">
            <img
              src={images[imgIdx] ? cloudinaryThumb(images[imgIdx].secure_url, 1000) : primaryImage(product)}
              srcSet={images[imgIdx] ? srcSetFor(images[imgIdx].secure_url, [600, 1000, 1400]) : undefined}
              sizes="(max-width: 768px) 100vw, 50vw"
              alt={images[imgIdx]?.alt_text || product.name}
              className="aspect-square w-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto" role="listbox" aria-label="Product images">
              {images.map((im, i) => (
                <button
                  key={im.id}
                  onClick={() => setImgIdx(i)}
                  className={clsx(
                    'h-20 w-20 shrink-0 overflow-hidden rounded-xl ring-2',
                    i === imgIdx ? 'ring-ember' : 'ring-transparent'
                  )}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={cloudinaryThumb(im.secure_url, 200, 'eco')} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-ink/40">{product.category?.name}</p>
          <h1 className="mt-1 font-display text-2xl font-black tracking-tight sm:text-3xl">{product.name}</h1>
          {(product.tags?.length ?? 0) > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Product tags">
              {product.tags!.slice(0, 3).map((t) => (
                <Link
                  key={t}
                  to={`/shop?tag=${encodeURIComponent(t)}`}
                  className="rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-bold text-ink/60 transition hover:bg-ember/10 hover:text-ember"
                >
                  #{t}
                </Link>
              ))}
            </div>
          )}
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1">
              <Star size={15} className="fill-ember text-ember" />
              <strong>{Number(product.rating_avg).toFixed(1)}</strong>
            </span>
            <span className="text-ink/50">· {product.rating_count} review{product.rating_count === 1 ? '' : 's'}</span>
            <span className="text-ink/50">· {product.total_sold} sold</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            {pct && <Badge>-{pct}%</Badge>}
            {product.is_new && <Badge tone="ink">New</Badge>}
            {variant && variant.stock > 0 && variant.stock <= variant.low_stock_threshold && (
              <Badge tone="red">Only {variant.stock} left</Badge>
            )}
            {out && <Badge tone="red">Out of stock</Badge>}
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display text-3xl font-black">{formatNPR(unit)}</span>
            {product.compare_at_price && Number(product.compare_at_price) > unit && (
              <span className="text-lg text-ink/40 line-through">{formatNPR(product.compare_at_price)}</span>
            )}
          </div>
          {(product.cost_price ?? 0) > 0 && (
            <p className="mt-1 text-xs text-ink/50">
              Real price {formatNPR(product.cost_price)} + {profitMargin}% store margin included.
            </p>
          )}

          {/* Variants */}
          {(product.variants?.length ?? 0) > 0 && (
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-widest text-ink/60">
                Select variant {variant && <span className="text-ink">— {variant.name}</span>}
              </p>
              <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Variants">
                {product.variants!.filter((v) => v.is_active).map((v) => (
                  <button
                    key={v.id}
                    role="radio"
                    aria-checked={variant?.id === v.id}
                    onClick={() => setVariant(v)}
                    disabled={v.stock <= 0}
                    className={clsx(
                      'rounded-full border px-4 py-2 text-sm font-semibold transition',
                      variant?.id === v.id
                        ? 'border-ink bg-ink text-paper'
                        : 'border-ink/15 bg-white hover:border-ink/40',
                      v.stock <= 0 && 'cursor-not-allowed opacity-40 line-through'
                    )}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
              {!variant && <p className="mt-2 text-xs text-red-600">Please choose a variant.</p>}
            </div>
          )}

          {/* Qty + CTA */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-ink/15 bg-white">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2.5 hover:text-ember" aria-label="Decrease quantity">
                <Minus size={16} />
              </button>
              <span className="w-8 text-center text-sm font-bold" aria-live="polite">{qty}</span>
              <button
                onClick={() => setQty(Math.min(variant?.stock || 99, qty + 1))}
                className="p-2.5 hover:text-ember"
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>
            <Button
              disabled={!variant || out}
              onClick={() => {
                if (!variant) return;
                void add(product, variant, qty).then(() => {
                  setAdded(true);
                  setTimeout(() => setAdded(false), 2000);
                });
              }}
              className="flex-1 sm:flex-none sm:px-8"
            >
              <ShoppingBag size={16} /> {added ? 'Added to bag!' : out ? 'Sold out' : 'Add to bag'}
            </Button>
            <button
              onClick={() => void toggle(product.id)}
              aria-pressed={wished}
              aria-label="Toggle wishlist"
              className={clsx('rounded-full border p-3', wished ? 'border-ember bg-ember text-white' : 'border-ink/15 bg-white')}
            >
              <Heart size={17} fill={wished ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={() => {
                const url = window.location.href;
                const done = () => {
                  setShared(true);
                  setTimeout(() => setShared(false), 2000);
                };
                if (navigator.share) {
                  navigator.share({ title: product.name, url }).then(done).catch(() => undefined);
                } else if (navigator.clipboard) {
                  navigator.clipboard.writeText(url).then(done).catch(() => undefined);
                }
              }}
              aria-label="Share this product"
              className="rounded-full border border-ink/15 bg-white p-3 transition hover:border-ink/40"
            >
              {shared ? <Check size={17} className="text-ember" /> : <Share2 size={17} />}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 text-xs text-ink/70">
            <span className="flex items-center gap-1.5 rounded-xl bg-white p-3 ring-1 ring-ink/5"><Truck size={14} className="text-ember" /> 1–3 day Valley delivery</span>
            <span className="flex items-center gap-1.5 rounded-xl bg-white p-3 ring-1 ring-ink/5"><ShieldCheck size={14} className="text-ember" /> Cash on Delivery available</span>
          </div>

          <div className="mt-6">
            <h2 className="font-display text-lg font-extrabold">About this product</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink/70">{product.description || 'No description yet.'}</p>
          </div>

          {/* Specifications — built from this product's own variants */}
          {(product.variants?.length ?? 0) > 0 && (
            <div className="mt-6 overflow-hidden rounded-2xl bg-white ring-1 ring-ink/5">
              <h2 className="border-b border-ink/10 px-5 py-3.5 font-display text-base font-extrabold">
                Specifications <span className="ml-1 text-xs font-semibold text-ink/40">{product.variants!.length} option{product.variants!.length === 1 ? '' : 's'}</span>
              </h2>
              <ul className="divide-y divide-ink/5">
                {product.variants!.filter((v) => v.is_active).map((v) => {
                  const price = Number(product.base_price) + Number(v.price_adjustment);
                  const state = v.stock <= 0 ? 'Sold out' : v.stock <= v.low_stock_threshold ? `Only ${v.stock} left` : 'In stock';
                  return (
                    <li key={v.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold">{v.name}</span>
                        <span className="block truncate font-mono text-[11px] text-ink/40">{v.sku}</span>
                      </span>
                      {v.size && <span className="hidden shrink-0 rounded-lg bg-ink/5 px-2 py-1 text-xs font-bold sm:block">Size {v.size}</span>}
                      {v.color && <span className="hidden shrink-0 rounded-lg bg-ink/5 px-2 py-1 text-xs font-bold sm:block">{v.color}</span>}
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${v.stock <= 0 ? 'bg-red-100 text-red-700' : v.stock <= v.low_stock_threshold ? 'bg-ember/10 text-ember' : 'bg-green-100 text-green-800'}`}>
                        {state}
                      </span>
                      <span className="shrink-0 font-display font-extrabold">{formatNPR(price)}</span>
                    </li>
                  );
                })}
              </ul>
              <dl className="grid grid-cols-1 gap-px border-t border-ink/10 bg-ink/10 text-xs sm:grid-cols-2">
                {[
                  ...((product.brand ?? '') !== '' ? [['Brand', product.brand] as [string, string]] : []),
                  // Brand already has its own row above — never repeat it from specs.
                  ...Object.entries(product.specs ?? {})
                    .filter(([k, v]) => k.toLowerCase() !== 'brand' && v != null && String(v).trim() !== ''),
                ].map(([k, v]) => (
                  <div key={k} className="bg-white px-5 py-3">
                    <dt className="font-bold uppercase tracking-wider text-ink/40">{specLabel(k)}</dt>
                    <dd className="mt-0.5 font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-14">
        <h2 className="font-display text-2xl font-black">Reviews ({reviews.length})</h2>
        {!user && <p className="mt-1 text-sm text-ink/60">Only verified buyers can write reviews. <Link to="/login" className="font-bold text-ember">Log in</Link> to share yours.</p>}
        {reviews.length === 0 ? (
          <p className="mt-4 text-sm text-ink/60">No approved reviews yet. Be the first to review after delivery.</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {reviews.map((r) => (
              <article key={r.id} className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink/5">
                <div className="flex items-center gap-1" aria-label={`${r.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14} className={s <= r.rating ? 'fill-ember text-ember' : 'text-ink/20'} />
                  ))}
                </div>
                {r.title && <p className="mt-2 font-bold">{r.title}</p>}
                <p className="mt-1 text-sm text-ink/70">{r.body}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Recommended — engine blends your viewed tags/categories with fresh picks */}
      {recommended.filter((r) => r.id !== product.id).length > 0 && (
        <section className="mt-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ember">Picked for you</p>
          <h2 className="mt-1 font-display text-2xl font-black">Recommended</h2>
          <div className="mt-5"><ProductGrid products={recommended.filter((r) => r.id !== product.id).slice(0, 6)} /></div>
        </section>
      )}

      {/* Sticky add-to-bag bar — phones only, sits above the bottom tab bar */}
      <div className="glass fixed inset-x-0 bottom-[calc(60px+env(safe-area-inset-bottom))] z-30 border-t border-ink/10 px-4 py-2.5 lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold">{product.name}</p>
            <p className="font-display text-base font-black">{formatNPR(unit)}</p>
          </div>
          <Button
            disabled={!variant || out}
            onClick={() => {
              if (!variant) return;
              void add(product, variant, qty).then(() => {
                setAdded(true);
                setTimeout(() => setAdded(false), 2000);
              });
            }}
            className="!px-6 !py-2.5"
          >
            <ShoppingBag size={15} /> {added ? 'Added!' : out ? 'Sold out' : 'Add to bag'}
          </Button>
        </div>
      </div>
    </div>
  );
}
