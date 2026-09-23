import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Truck, Package, Home, Star } from 'lucide-react';
import { clsx } from 'clsx';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import type { Order } from '../types';
import { cloudinaryThumb, formatNPR } from '../lib/shop';
import { CUSTOMER_CANCEL_REASONS } from '../lib/orderCancel';
import { CancelOrderBox } from '../components/CancelOrderBox';
import { Badge, Button, EmptyState, ErrorState, Notice, Skeleton } from '../components/ui';
import { usePageTitle } from '../hooks/usePageTitle';

const STAGES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] as const;

export default function OrderDetailPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [review, setReview] = useState({ productId: '', rating: 5, title: '', body: '' });
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);
  const [reviewOk, setReviewOk] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  usePageTitle(order?.order_number ?? 'Order details');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    let q = supabase.from('orders').select('*, items:order_items(*)').eq('id', id);
    // customers only ever see their own orders (admins use the dashboard)
    if (user) q = q.eq('user_id', user.id);
    q.single()
      .then(({ data, error: err }) => {
        if (err) setLoadError(err.message);
        else setOrder((data ?? null) as Order | null);
        setLoading(false);
      }, () => {
        setLoadError('Could not reach the server. Check your connection.');
        setLoading(false);
      });
  }, [id, user]);

  if (loading) return <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8"><Skeleton className="h-64" /></div>;
  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        <Link to="/orders" className="text-xs font-bold text-ember hover:underline">← All orders</Link>
        <div className="mt-4"><ErrorState message={loadError} onRetry={() => window.location.reload()} /></div>
      </div>
    );
  }
  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
        <EmptyState title="Order not found" body="Check the link or your order history." action={<Link to="/orders"><Button variant="dark">Back to orders</Button></Link>} />
      </div>
    );
  }

  const stageIdx = STAGES.indexOf(order.status as (typeof STAGES)[number]);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <Link to="/orders" className="text-xs font-bold text-ember hover:underline">← All orders</Link>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h1 className="font-display text-3xl font-black">{order.order_number}</h1>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(order.order_number).catch(() => undefined);
          }}
          aria-label="Copy order number"
          title="Copy order number"
          className="rounded-full border border-ink/15 bg-white px-3 py-1 text-xs font-bold text-ink/60 transition hover:border-ink/40 hover:text-ink"
        >
          Copy №
        </button>
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
            {it.image_url && <img src={cloudinaryThumb(it.image_url, 200, 'eco')} alt="" className="h-14 w-14 rounded-lg object-cover" loading="lazy" />}
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

      {/* Cancellation — pending orders only; reason required, stock returns */}
      {order.status === 'pending' && (
        <div className="mt-5">
          <CancelOrderBox
            presets={CUSTOMER_CANCEL_REASONS}
            title="Cancel this order"
            body="Your items go back on sale immediately. This cannot be undone."
            onConfirm={async (reason) => {
              const { error } = await supabase.rpc('cancel_order', { p_order: order.id, p_reason: reason });
              if (error) throw new Error(error.message);
              setOrder({ ...order, status: 'cancelled', cancel_reason: reason, cancelled_by: 'customer' });
            }}
          />
        </div>
      )}
      {order.status === 'cancelled' && order.cancel_reason && (
        <div className="mt-5">
          <Notice tone="info">Cancelled{order.cancelled_by === 'admin' ? ' by the store' : ''} — reason: “{order.cancel_reason}”.</Notice>
        </div>
      )}

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
            <input value={review.title} onChange={(e) => setReview({ ...review, title: e.target.value })} placeholder="Title" maxLength={120} className="rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm" />
            <textarea value={review.body} onChange={(e) => setReview({ ...review, body: e.target.value })} placeholder="How was the fit, fabric, delivery?" rows={3} maxLength={2000} className="rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm sm:col-span-2" />
          </div>
          {reviewMsg && (
            <div className="mt-2">
              <Notice tone={reviewOk ? 'success' : 'error'}>{reviewMsg}</Notice>
            </div>
          )}
          <Button
            variant="dark"
            className="mt-3"
            disabled={reviewBusy}
            onClick={() => {
              if (!review.productId) {
                setReviewOk(false);
                setReviewMsg('Pick which product you are reviewing first.');
                return;
              }
              if (review.title.trim().length > 120) {
                setReviewOk(false);
                setReviewMsg('Keep the title under 120 characters.');
                return;
              }
              if (review.body.trim().length > 2000) {
                setReviewOk(false);
                setReviewMsg('Keep the review under 2000 characters.');
                return;
              }
              setReviewBusy(true);
              setReviewMsg(null);
              supabase.from('reviews').insert({
                product_id: review.productId,
                user_id: user.id,
                order_id: order.id,
                rating: review.rating,
                title: review.title.trim(),
                body: review.body.trim(),
              }).then(({ error }) => {
                setReviewBusy(false);
                if (error) {
                  setReviewOk(false);
                  setReviewMsg(
                    error.message.includes('duplicate') || error.code === '23505'
                      ? 'You already reviewed this product for this order — thanks!'
                      : error.message
                  );
                } else {
                  setReviewOk(true);
                  setReviewMsg('Thanks! Your review is in and waiting for moderation.');
                  setReview({ productId: '', rating: 5, title: '', body: '' });
                }
              }, () => {
                setReviewBusy(false);
                setReviewOk(false);
                setReviewMsg('Could not reach the server. Try again in a bit.');
              });
            }}
          >
            {reviewBusy ? 'Sending…' : 'Submit review'}
          </Button>
        </section>
      )}
    </div>
  );
}
