import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Heart, Plus, Star } from 'lucide-react';
import { clsx } from 'clsx';
import type { Product } from '../types';
import { cloudinaryThumb, discountPct, formatNPR } from '../lib/shop';
import { useWishlist } from '../hooks/useShop';
import { useCart } from '../store/CartContext';
import { Badge } from './ui';

export function primaryImage(p: Product, width = 700): string {
  const imgs = [...(p.images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order
  );
  if (imgs[0]) return cloudinaryThumb(imgs[0].secure_url, width);
  // Studio-light placeholder (soft daylight sweep, 1:1 — not a fake product photo).
  // Real shots uploaded in admin replace this automatically.
  const xmlEsc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const initial = xmlEsc((p.name.trim()[0] ?? 'D').toUpperCase());
  const label = xmlEsc(p.name.slice(0, 22));
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">` +
    `<defs><radialGradient id="g" cx="50%" cy="32%" r="80%">` +
    `<stop offset="0%" stop-color="#FFFFFF"/><stop offset="58%" stop-color="#F4F2EC"/>` +
    `<stop offset="100%" stop-color="#DFDCD2"/></radialGradient></defs>` +
    `<rect width="800" height="800" fill="url(#g)"/>` +
    `<ellipse cx="400" cy="648" rx="190" ry="30" fill="#101010" opacity="0.08"/>` +
    `<text x="400" y="470" fill="#101010" opacity="0.10" font-family="Arial" font-size="340" font-weight="900" text-anchor="middle">${initial}</text>` +
    `<text x="400" y="600" fill="#101010" opacity="0.55" font-family="Arial" font-size="34" font-weight="700" text-anchor="middle">${label}</text>` +
    `<text x="400" y="648" fill="#F06427" font-family="Arial" font-size="24" font-weight="900" text-anchor="middle">DROPX STUDIO</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Raw (untransformed) primary URL — used to build responsive srcsets. */
function rawPrimary(p: Product): string | null {
  const imgs = [...(p.images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order
  );
  return imgs[0]?.secure_url ?? null;
}

/** Optimized responsive srcset for Cloudinary delivery URLs. */
export function srcSetFor(
  url: string | null,
  widths: number[],
  quality: 'auto' | 'eco' | 'good' = 'auto'
): string | undefined {
  if (!url || !url.includes('/upload/')) return undefined;
  return widths.map((w) => `${cloudinaryThumb(url, w, quality)} ${w}w`).join(', ');
}

/** "battery_life" → "Battery Life" for spec table labels. */
export function specLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function minPrice(p: Product): number {  const base = Number(p.base_price);
  const adj = (p.variants ?? []).map((v) => Number(v.price_adjustment));
  if (adj.length === 0) return base;
  return base + Math.min(...adj);
}

export function stockOf(p: Product): number {
  return (p.variants ?? []).reduce((s, v) => s + (v.is_active ? v.stock : 0), 0);
}

export function ProductCard({ product }: { product: Product }) {
  const { has, toggle } = useWishlist();
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const wished = has(product.id);
  const pct = discountPct(minPrice(product), product.compare_at_price ? Number(product.compare_at_price) : null);
  const buyable = (product.variants ?? []).filter((v) => v.is_active && v.stock > 0);
  const out = buyable.length === 0 && (product.variants?.length ?? 0) > 0;
  const quickVariant = buyable.length === 1 ? buyable[0] : null;
  const raw = rawPrimary(product);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-ink/5 transition duration-300 hover:-translate-y-1 hover:shadow-pop">
      <div className="relative">
        <Link to={`/product/${product.slug}`} aria-label={product.name} className="relative block">
          <div className="relative aspect-square overflow-hidden bg-paper-dark">
          <img
            src={primaryImage(product)}
            srcSet={srcSetFor(raw, [320, 640, 960], 'eco')}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 20vw, 16vw"
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]"
            />
            {/* At most one badge keeps the tile calm: Sold out wins, else discount, else New. */}
            <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
              {out ? (
                <Badge tone="red">Sold out</Badge>
              ) : (
                <>
                  {pct && <Badge>-{pct}%</Badge>}
                  {!pct && product.is_new && <Badge tone="ink">New</Badge>}
                </>
              )}
            </div>
          </div>
        </Link>
      </div>
      <button
        onClick={() => void toggle(product.id)}
        aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={wished}
        className={clsx(
          'absolute right-3 top-3 z-10 rounded-full p-2 shadow-card transition',
          wished ? 'bg-ember text-white' : 'bg-white/90 text-ink opacity-100 hover:bg-white md:opacity-0 md:group-hover:opacity-100'
        )}
      >
        <Heart size={16} fill={wished ? 'currentColor' : 'none'} />
      </button>
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <Link to={`/product/${product.slug}`} className="block font-display text-[15px] font-bold leading-snug hover:text-ember">
          <span className="clamp-2">{product.name}</span>
        </Link>
        <div className="mt-1 flex items-center gap-1 text-xs text-ink/60">
          <Star size={13} className="fill-ember text-ember" />
          <span className="font-semibold text-ink">{Number(product.rating_avg).toFixed(1)}</span>
          <span>({product.rating_count})</span>
          {stockOf(product) > 0 && stockOf(product) <= 5 && (
            <span className="ml-auto shrink-0 font-bold text-ember">Only {stockOf(product)} left</span>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <p className="min-w-0">
            <span className="font-display text-[17px] font-extrabold">{formatNPR(minPrice(product))}</span>
            {product.compare_at_price && Number(product.compare_at_price) > minPrice(product) && (
              <span className="ml-1.5 text-[13px] text-ink/40 line-through">{formatNPR(product.compare_at_price)}</span>
            )}
          </p>
          {quickVariant && !out && (
            <button
              onClick={() => {
                void add(product, quickVariant, 1).then(() => {
                  setAdded(true);
                  setTimeout(() => setAdded(false), 1600);
                });
              }}
              aria-label={added ? 'Added to bag' : `Quick add ${product.name}`}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition active:scale-95 ${
                added ? 'bg-ember text-white' : 'bg-ink text-paper hover:bg-ember'
              }`}
            >
              {added ? <Check size={16} /> : <Plus size={16} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export const GRID_COMPACT =
  'grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] lg:grid-cols-[repeat(auto-fit,minmax(210px,1fr))]';
export const GRID_COMFORTABLE =
  'grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] lg:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]';

/** Swipeable rail on phones, calm 4-column grid on desktop (category tiles). */
export const GRID_RAIL =
  'no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0';

export function ProductGrid({ products, density = 'compact' }: { products: Product[]; density?: 'compact' | 'comfortable' }) {
  // Phones: strict 2 columns. Beyond that auto-fit: rows always stretch
  // edge to edge, however many items remain.
  return (
    <div className={density === 'comfortable' ? GRID_COMFORTABLE : GRID_COMPACT}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
