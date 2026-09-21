import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Truck, Package, Home, Star } from 'lucide-react';
import { clsx } from 'clsx';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import type { Order } from '../types';
import { formatNPR } from '../lib/shop';
import { Badge, Button, EmptyState, Skeleton } from '../components/ui';

const STAGES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] as const;

export default function OrderDetailPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState({ productId: '', rating: 5, title: '', body: '' });
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase.from('orders').select('*, items:order_items(*)').eq('id', id).single()
      .then(({ data }) => {
        setOrder((data ?? null) as Order | null);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-8"><Skeleton className="h-64" /></div>;
  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState title="Order not found" body="Check the link or your order history." action={<Link to="/orders" className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-paper">Back to orders</Link>} />
      </div>
    );
  }

  const stageIdx = STAGES.indexOf(order.status as (typeof STAGES)[number]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/orders" className="text-xs font-bold text-ember hover:underline">← All orders</Link>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h1 className="font-display text-3xl font-black">{order.order_number}</h1>
        <Badge>{order.status}</Badge>
        <Badge tone="paper">{order.payment_status.replace('_', ' ')}</Badge>
      </div>
      <p className="mt-1 text-sm text-ink/60">
        Placed {new Date(order.placed_at).toLocaleString('en-NP')} · {order.shipping_method} · {formatNPR(order.grand_total)}
      </p>

      {/* Tracking timeline */}
      <ol className="mt-6 rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink/5" aria-label="Order tracking">
        {STAGES.map((s, i) => {
          const done = stageIdx >= 0 && i <= stageIdx;
          const Icon = s === 'delivered' ? Home : s === 'shipped' ? Truck : s === 'pending' ? Package : Check;
          return (
            <li key={s} className="flex gap-3">
              <span className="flex flex-col items-center">
                <span className={clsx('flex h-8 w-8 items-center justify-center rounded-full', done ? 'bg-ember text-white' : 'bg-ink/10 text-ink/40')}>
                  <Icon size={15} />
                </span>
                {i < STAGES.length - 1 && <span className={clsx('h-6 w-0.5', done ? 'bg-ember' : 'bg-ink/10')} />}
              </span>
              <span className="pb-5">
                <span className={clsx('block text-sm font-bold capitalize', done ? '' : 'text-ink/40')}>{s}</span>
                <span className="block text-xs text-ink/50">
                  {s === 'pending' && 'We received your order.'}
                  {s === 'confirmed' && 'Confirmed — preparing your items.'}
                  {s === 'processing' && 'Packed and ready for the courier.'}
                  {s === 'shipped' && `On the way to ${order.shipping_city}.`}
                  {s === 'delivered' && 'Delivered. Enjoy the drop!'}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      {/* Items */}
      <ul className="mt-5 space-y-2">
        {(order.items ?? []).map((it) => (
          <li key={it.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card ring-1 ring-ink/5">
            {it.image_url && <img src={it.image_url} alt="" className="h-14 w-12 rounded-lg object-cover" loading="lazy" />}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{it.product_name}</p>
              <p className="text-xs text-ink/50">{it.variant_name ?? ''} · × {it.quantity}</p>
            </div>
            <p className="text-sm font-bold">{formatNPR(it.line_total)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-2xl bg-ink p-5 text-sm text-paper">
        <p className="font-bold">Deliver to</p>
        <p className="mt-1 text-paper/70">{order.shipping_name} · {order.shipping_phone}</p>
        <p className="text-paper/70">{order.shipping_street}, {order.shipping_city}, {order.shipping_province}</p>
        <dl className="mt-3 space-y-1 border-t border-paper/10 pt-3">
          <div className="flex justify-between"><dt className="text-paper/60">Subtotal</dt><dd>{formatNPR(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-paper/60">Shipping</dt><dd>{Number(order.shipping_fee) === 0 ? 'FREE' : formatNPR(order.shipping_fee)}</dd></div>
          <div className="flex justify-between font-display text-base font-black"><dt>Total</dt><dd>{formatNPR(order.grand_total)}</dd></div>
        </dl>
      </div>

      {/* Review form (verified buyers on delivered orders) */}
      {order.status === 'delivered' && user && (order.items ?? []).length > 0 && (
        <section className="mt-5 rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink/5">
          <h2 className="flex items-center gap-2 font-display text-lg font-extrabold"><Star size={17} className="text-ember" /> Write a review</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <select
              value={review.productId}
              onChange={(e) => setReview({ ...review, productId: e.target.value })}
              className="rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm sm:col-span-2"
              aria-label="Product to review"
            >
              <option value="">Select product…</option>
              {(order.items ?? []).filter((i) => i.product_id).map((i) => (
                <option key={i.id} value={i.product_id!}>{i.product_name}</option>
              ))}
            </select>
            <select value={review.rating} onChange={(e) => setReview({ ...review, rating: Number(e.target.value) })} className="rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm" aria-label="Rating">
              {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} star{r > 1 ? 's' : ''}</option>)}
            </select>
            <input value={review.title} onChange={(e) => setReview({ ...review, title: e.target.value })} placeholder="Title" className="rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm" />
            <textarea value={review.body} onChange={(e) => setReview({ ...review, body: e.target.value })} placeholder="How was the fit, fabric, delivery?" rows={3} className="rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm sm:col-span-2" />
          </div>
          {reviewMsg && <p className="mt-2 text-xs">{reviewMsg}</p>}
          <Button
            variant="dark"
            className="mt-3"
            onClick={() => {
              if (!review.productId) {
                setReviewMsg('Select a product first.');
                return;
              }
              supabase.from('reviews').insert({
                product_id: review.productId,
                user_id: user.id,
                order_id: order.id,
                rating: review.rating,
                title: review.title,
                body: review.body,
              }).then(({ error }) => {
                setReviewMsg(error ? error.message : 'Thanks! Your review is pending moderation.');
              });
            }}
          >
            Submit review
          </Button>
        </section>
      )}
    </div>
  );
}
