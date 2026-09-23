import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import type { Order } from '../types';
import { formatNPR } from '../lib/shop';
import { Badge, Button, EmptyState, ErrorState, PageHeader, Skeleton } from '../components/ui';
import { usePageTitle } from '../hooks/usePageTitle';

const tone = (s: string) => (s === 'delivered' || s === 'paid' ? 'green' : s === 'cancelled' || s === 'failed' ? 'red' : s === 'pending' || s === 'unpaid' ? 'paper' : 'ember') as 'green' | 'red' | 'paper' | 'ember';

export default function OrdersPage() {
  const { user } = useAuth();
  usePageTitle('Order History');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    supabase.from('orders').select('*').eq('user_id', user.id).order('placed_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setOrders((data ?? []) as Order[]);
        setLoading(false);
      }, () => {
        setError('Could not reach the server. Check your connection.');
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="mx-auto max-w-5xl space-y-3 px-4 sm:px-6 py-8"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>;

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <PageHeader title="Order history" sub="Your orders and live tracking." />
        <div className="mt-6"><ErrorState message={error} onRetry={load} /></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16">
        <EmptyState title="No orders yet" body="Your order history and live tracking will appear here." action={<Link to="/shop"><Button>Start shopping</Button></Link>} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <PageHeader title="Order history" sub={`${orders.length} order${orders.length === 1 ? '' : 's'} · tap one to track it.`} />
      <ul className="mt-6 space-y-3">
        {orders.map((o) => (
          <li key={o.id}>
            <Link to={`/orders/${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-white p-4 shadow-card ring-1 ring-ink/5 transition hover:shadow-pop">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink text-paper"><Package size={18} /></span>
              <span className="min-w-0 flex-1 basis-32">
                <span className="block font-display font-bold">{o.order_number}</span>
                <span className="block text-xs text-ink/50">
                  {new Date(o.placed_at).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' })} · {formatNPR(o.grand_total)}
                </span>
              </span>
              <span className="flex flex-wrap gap-1.5">
                <Badge tone={tone(o.status)}>{o.status}</Badge>
                <Badge tone={tone(o.payment_status)}>{o.payment_status.replace('_', ' ')}</Badge>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
