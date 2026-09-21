import { Link } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import { clsx } from 'clsx';
import type { Product } from '../types';
import { cloudinaryThumb, discountPct, formatNPR } from '../lib/shop';
import { useWishlist } from '../hooks/useShop';
import { Badge } from './ui';

export function primaryImage(p: Product): string {
  const imgs = [...(p.images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order
  );
  if (imgs[0]) return cloudinaryThumb(imgs[0].secure_url, 700);
  // Branded placeholder (SVG data URI in brand colors — not a fake product photo)
  const label = encodeURIComponent(p.name.slice(0, 18));
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="800"><rect width="700" height="800" fill="#101010"/><text x="50%" y="46%" fill="#F06427" font-family="Arial" font-size="44" font-weight="900" text-anchor="middle">DropX</text><text x="50%" y="56%" fill="#F7F5F0" font-family="Arial" font-size="22" text-anchor="middle">${label}</text></svg>`
  )}`;
}

export function minPrice(p: Product): number {
  const base = Number(p.base_price);
  const adj = (p.variants ?? []).map((v) => Number(v.price_adjustment));
  if (adj.length === 0) return base;
  return base + Math.min(...adj);
}

export function stockOf(p: Product): number {
  return (p.variants ?? []).reduce((s, v) => s + (v.is_active ? v.stock : 0), 0);
}

export function ProductCard({ product }: { product: Product }) {
  const { has, toggle } = useWishlist();
  const wished = has(product.id);
  const pct = discountPct(minPrice(product), product.compare_at_price ? Number(product.compare_at_price) : null);
  const out = stockOf(product) <= 0 && (product.variants?.length ?? 0) > 0;

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-ink/5 transition hover:-translate-y-0.5 hover:shadow-pop">
      <Link to={`/product/${product.slug}`} aria-label={product.name}>
        <div className="relative aspect-[7/8] overflow-hidden bg-paper-dark">
          <img
            src={primaryImage(product)}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {pct && <Badge>-{pct}%</Badge>}
            {product.is_new && <Badge tone="ink">New</Badge>}
            {out && <Badge tone="red">Sold out</Badge>}
          </div>
        </div>
      </Link>
      <button
        onClick={() => void toggle(product.id)}
        aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={wished}
        className={clsx(
          'absolute right-3 top-3 rounded-full p-2 shadow-card transition',
          wished ? 'bg-ember text-white' : 'bg-white/90 text-ink hover:bg-white'
        )}
      >
        <Heart size={16} fill={wished ? 'currentColor' : 'none'} />
      </button>
      <div className="p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-ink/40">
          {product.category?.name ?? 'DropX'}
        </p>
        <Link to={`/product/${product.slug}`} className="mt-0.5 block font-display font-bold leading-snug hover:text-ember">
          <span className="clamp-2">{product.name}</span>
        </Link>
        <div className="mt-1.5 flex items-center gap-1 text-xs text-ink/60">
          <Star size={13} className="fill-ember text-ember" />
          <span className="font-semibold text-ink">{Number(product.rating_avg).toFixed(1)}</span>
          <span>({product.rating_count})</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-lg font-extrabold">{formatNPR(minPrice(product))}</span>
          {product.compare_at_price && Number(product.compare_at_price) > minPrice(product) && (
            <span className="text-sm text-ink/40 line-through">{formatNPR(product.compare_at_price)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
