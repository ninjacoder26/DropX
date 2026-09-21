import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Order } from '../types';
import { formatNPR } from '../lib/shop';

export default function OrderSuccessPage() {
  const { id = '' } = useParams();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.from('orders').select('*, items:order_items(*)').eq('id', id).single()
      .then(({ data }) => {
        if (data) setOrder(data as unknown as Order);
      });
  }, [id]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 text-center">
      <CheckCircle2 size={56} className="mx-auto text-ember" />
      <h1 className="mt-4 font-display text-3xl font-black">Order placed!</h1>
      <p className="mt-2 text-sm text-ink/60">
        {order ? (
          <>Order <strong className="text-ink">{order.order_number}</strong> · {formatNPR(order.grand_total)} · {order.payment_provider === 'bank_transfer' ? 'Bank transfer — we will call you with the account details.' : 'Cash on Delivery.'} We will call to confirm before dispatch.</>
        ) : (
          <>Your order is confirmed. We will call to confirm before dispatch.</>
        )}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to={order ? `/orders/${order.id}` : '/orders'} className="rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-paper">
          Track order
        </Link>
        <Link to="/shop" className="rounded-full border border-ink/15 bg-white px-6 py-2.5 text-sm font-bold">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
