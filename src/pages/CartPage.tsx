import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../store/CartContext';
import { formatNPR } from '../lib/shop';
import { useStoreSettings } from '../lib/settings';
import { Button } from '../components/ui';
import { usePageTitle } from '../hooks/usePageTitle';
import { EmptyState } from '../components/ui';
import { primaryImage } from '../components/product';

export default function CartPage() {
  const { lines, subtotal, setQty, remove, count } = useCart();
  const { freeShippingThreshold } = useStoreSettings();
  usePageTitle('Your Bag');
  const progress = Math.min(1, subtotal / freeShippingThreshold);

  if (lines.length === 0) {
    return (
      <div className="dx-full py-16">
        <EmptyState
          title="Your bag is empty"
          body="Beautiful drops are waiting. Start with trending picks or the Drop of the Month."
          action={<Link to="/shop" className="rounded-full bg-ember px-6 py-2.5 text-sm font-bold text-white">Start shopping</Link>}
        />
      </div>
    );
  }

  return (
    <div className="dx-full py-8">
      <h1 className="font-display text-3xl font-black">Your bag ({count})</h1>

      <div className="mt-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-ink/5">
        <p className="text-xs font-semibold text-ink/70">
          {subtotal >= freeShippingThreshold
            ? 'You unlocked FREE standard shipping.'
            : `${formatNPR(freeShippingThreshold - subtotal)} away from free standard shipping`}
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-ember transition-all" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-3">
          {lines.map((l) => (
            <li
              key={`${l.product.id}-${l.variant?.id ?? 'base'}`}
              className="grid grid-cols-[5rem_minmax(0,1fr)] gap-3 rounded-2xl bg-white p-3 shadow-card ring-1 ring-ink/5 sm:gap-4 sm:p-4"
            >
              <Link to={`/product/${l.product.slug}`} className="aspect-square w-full overflow-hidden rounded-xl bg-paper-dark">
                <img src={primaryImage(l.product, 200)} alt={l.product.name} className="h-full w-full object-cover" loading="lazy" />
              </Link>
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link to={`/product/${l.product.slug}`} className="block truncate font-display font-bold hover:text-ember">
                      {l.product.name}
                    </Link>
                    {l.variant && <p className="mt-0.5 truncate text-xs text-ink/50">{l.variant.name} · {l.variant.sku}</p>}
                  </div>
                  <button
                    onClick={() => void remove(l.product.id, l.variant?.id ?? null)}
                    aria-label={`Remove ${l.product.name}`}
                    className="shrink-0 rounded-full p-1.5 text-ink/40 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <p className="mt-1 text-xs text-ink/50">{formatNPR(l.unitPrice)} each</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center rounded-full border border-ink/15">
                    <button onClick={() => void setQty(l.product.id, l.variant?.id ?? null, l.quantity - 1)} className="p-2.5 hover:text-ember" aria-label="Decrease quantity">
                      <Minus size={14} />
                    </button>
                    <span className="w-7 text-center text-sm font-bold" aria-live="polite">{l.quantity}</span>
                    <button onClick={() => void setQty(l.product.id, l.variant?.id ?? null, l.quantity + 1)} className="p-2.5 hover:text-ember" aria-label="Increase quantity">
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="font-display font-extrabold">{formatNPR(l.unitPrice * l.quantity)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="glass-dark h-fit rounded-2xl p-6 text-paper lg:sticky lg:top-32">
          <h2 className="font-display text-lg font-extrabold">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-paper/60">Subtotal</dt><dd className="font-bold">{formatNPR(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-paper/60">Shipping</dt><dd className="font-bold">Calculated at checkout</dd></div>
          </dl>
          <Link to="/checkout">
            <Button className="mt-5 w-full">Proceed to checkout <ArrowRight size={16} /></Button>
          </Link>
          <Link to="/shop" className="mt-3 block text-center text-xs font-semibold text-paper/60 hover:text-paper">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
