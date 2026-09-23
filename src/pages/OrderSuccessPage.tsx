import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Order } from '../types';
import { formatNPR } from '../lib/shop';
import { Button, EmptyState, ErrorState, Skeleton } from '../components/ui';
import { usePageTitle } from '../hooks/usePageTitle';

export default function OrderSuccessPage() {
  const { id = '' } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  usePageTitle('Order placed');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase.from('orders').select('*, items:order_items(*)').eq('id', id).single()
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else if (data) setOrder(data as unknown as Order);
        setLoading(false);
      }, () => {
        setError('Could not reach the server. Check your connection.');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="mx-auto max-w-2xl px-4 sm:px-6 py-14"><Skeleton className="h-10 w-2/3 mx-auto" /><Skeleton className="h-5 mt-3" /></div>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-14">
        <CheckCircle2 size={56} className="mx-auto text-ember" />
        <h1 className="mt-4 text-center font-display text-3xl font-black">Order placed!</h1>
        <p className="mt-2 text-center text-sm text-ink/60">Your order is confirmed. We could not load its details just now.</p>
        <div className="mt-6"><ErrorState message={error} onRetry={() => window.location.reload()} /></div>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/orders"><Button variant="dark">Order history</Button></Link>
          <Link to="/shop"><Button variant="outline">Continue shopping</Button></Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-14">
        <EmptyState
          title="Order placed!"
          body="Your order is confirmed. We will call to confirm before dispatch."
          action={<div className="flex justify-center gap-3"><Link to="/orders"><Button variant="dark">Track order</Button></Link><Link to="/shop"><Button variant="outline">Continue shopping</Button></Link></div>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-14 text-center">
      <CheckCircle2 size={56} className="mx-auto text-ember" />
      <h1 className="mt-4 font-display text-3xl font-black">Order placed!</h1>
      <p className="mt-2 text-sm text-ink/60">
        Order <strong className="text-ink">{order.order_number}</strong> · {formatNPR(order.grand_total)} · Cash on Delivery. We will call to confirm before dispatch.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to={`/orders/${order.id}`}><Button variant="dark">Track order</Button></Link>
        <Link to="/shop"><Button variant="outline">Continue shopping</Button></Link>
      </div>
    </div>
  );
}
