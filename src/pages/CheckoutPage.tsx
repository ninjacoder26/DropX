import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { useCart } from '../store/CartContext';
import { NEPAL_PROVINCES, formatNPR } from '../lib/shop';
import { shippingFeeFor, useStoreSettings } from '../lib/settings';
import { PAYMENT_METHODS, type PaymentMethod } from '../lib/payments';
import { Button, Field, Input } from '../components/ui';
import { primaryImage } from '../components/product';

interface Addr {
  full_name: string;
  phone: string;
  province: string;
  city: string;
  street: string;
  postal_code: string;
}

const EMPTY: Addr = { full_name: '', phone: '', province: 'Bagmati', city: '', street: '', postal_code: '' };

export default function CheckoutPage() {
  const { user } = useAuth();
  const { lines, subtotal, clear } = useCart();
  const nav = useNavigate();
  const [addr, setAddr] = useState<Addr>(EMPTY);
  const [method, setMethod] = useState<'standard' | 'express'>('standard');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cod');
  const [notes, setNotes] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set when the order succeeds so the empty-cart redirect below doesn't
  // fire after we clear the cart on the way to the success page.
  const placedRef = useRef(false);

  useEffect(() => {
    if (lines.length === 0 && !placedRef.current) nav('/cart', { replace: true });
  }, [lines, nav]);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;
    supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          setAddr({
            full_name: data.full_name,
            phone: data.phone,
            province: data.province,
            city: data.city,
            street: data.street,
            postal_code: data.postal_code ?? '',
          });
        }
      });
  }, [user]);

  const settings = useStoreSettings();
  const shippingFee = shippingFeeFor(method, subtotal, settings);
  const total = subtotal + shippingFee;

  const valid =
    addr.full_name.trim().length >= 2 &&
    addr.phone.trim().length >= 7 &&
    addr.city.trim().length >= 2 &&
    addr.street.trim().length >= 3 &&
    agreed;

  async function placeOrder() {
    setError(null);
    if (!agreed) {
      setError('Please accept the Terms of Service and Privacy Policy to order.');
      return;
    }
    if (!valid) {
      setError('Please complete name, phone, city and street address.');
      return;
    }
    if (!isSupabaseConfigured || !user) {
      setError('Backend is not configured. Fill in src/config.ts to place orders.');
      return;
    }
    setPlacing(true);
    try {
      const items = lines.map((l) => ({
        product_id: l.product.id,
        variant_id: l.variant?.id ?? null,
        quantity: l.quantity,
      }));
      // Totals, stock and the payment method are all enforced server-side
      // inside place_order(). The order stays `unpaid` until an admin
      // confirms cash collection / verifies the bank receipt.
      const { data, error: rpcError } = await supabase.rpc('place_order', {
        p_items: items,
        p_address: addr,
        p_shipping_method: method,
        p_notes: notes,
        p_payment_provider: payMethod,
      });
      if (rpcError) throw new Error(rpcError.message);
      const orderId = data as string;
      placedRef.current = true;
      // Best-effort: remember this address for next time (never blocks success).
      if (user && isSupabaseConfigured) {
        supabase
          .from('addresses')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .then(({ count }) => {
            if (count === 0) {
              void supabase.from('addresses').insert({
                user_id: user.id,
                label: 'Home',
                full_name: addr.full_name,
                phone: addr.phone,
                province: addr.province,
                city: addr.city,
                street: addr.street,
                postal_code: addr.postal_code || null,
                is_default: true,
              });
            }
          });
      }
      await clear();
      nav(`/order-success/${orderId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Order failed. Please try again.');
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-3xl font-black">Checkout</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <section className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink/5">
            <h2 className="font-display text-lg font-extrabold">Delivery address</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <Input value={addr.full_name} onChange={(e) => setAddr({ ...addr, full_name: e.target.value })} placeholder="Aashish Sharma" autoComplete="name" />
              </Field>
              <Field label="Phone">
                <Input value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} placeholder="98XXXXXXXX" autoComplete="tel" />
              </Field>
              <Field label="Province">
                <select value={addr.province} onChange={(e) => setAddr({ ...addr, province: e.target.value })} className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm">
                  {NEPAL_PROVINCES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="City">
                <Input value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} placeholder="Kathmandu" autoComplete="address-level2" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Street / area">
                  <Input value={addr.street} onChange={(e) => setAddr({ ...addr, street: e.target.value })} placeholder="Lazimpat, House 12, Ward 2" autoComplete="street-address" />
                </Field>
              </div>
              <Field label="Postal code (optional)">
                <Input value={addr.postal_code} onChange={(e) => setAddr({ ...addr, postal_code: e.target.value })} placeholder="44600" inputMode="numeric" />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink/5">
            <h2 className="font-display text-lg font-extrabold">Shipping method</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(['standard', 'express'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  aria-pressed={method === m}
                  className={`rounded-2xl border p-4 text-left transition ${method === m ? 'border-ember bg-ember/5' : 'border-ink/15 hover:border-ink/40'}`}
                >
                  <p className="font-bold capitalize">{m} <span className="text-ink/50">· 2–5 days</span></p>
                  <p className="mt-1 text-sm font-bold text-ember">
                    {shippingFeeFor(m, subtotal, settings) === 0 ? 'FREE' : formatNPR(shippingFeeFor(m, subtotal, settings))}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink/5">
            <h2 className="font-display text-lg font-extrabold">Payment</h2>
            <p className="mt-1 text-xs text-ink/60">
              DropX takes no online payments. Your order stays <strong>unpaid</strong> until
              we confirm it — cash on delivery, or a bank receipt verified by our team.
            </p>
            <div className="mt-3 space-y-2">
              {PAYMENT_METHODS.map((p) => (
                <button
                  key={p.method}
                  onClick={() => setPayMethod(p.method)}
                  aria-pressed={payMethod === p.method}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    payMethod === p.method ? 'border-ember bg-ember/5' : 'border-ink/15 hover:border-ink/40'
                  }`}
                >
                  <span className="block font-bold">{p.label}</span>
                  <span className="mt-1 block text-xs text-ink/60">{p.hint}</span>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <Field label="Order notes (optional)">
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gate code, landmarks, delivery timing…" />
              </Field>
            </div>
          </section>

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-800">{error}</div>}
        </div>

        <aside className="h-fit rounded-2xl bg-ink p-6 text-paper lg:sticky lg:top-32">
          <h2 className="font-display text-lg font-extrabold">Order summary</h2>
          <ul className="mt-4 space-y-3">
            {lines.map((l) => (
              <li key={`${l.product.id}-${l.variant?.id}`} className="flex items-center gap-3">
                <img src={primaryImage(l.product)} alt="" className="h-12 w-12 rounded-lg object-cover" loading="lazy" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{l.product.name}</p>
                  <p className="text-xs text-paper/50">× {l.quantity}{l.variant ? ` · ${l.variant.name}` : ''}</p>
                </div>
                <p className="text-sm font-bold">{formatNPR(l.unitPrice * l.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-paper/10 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-paper/60">Subtotal</dt><dd>{formatNPR(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-paper/60">Shipping</dt><dd>{shippingFee === 0 ? 'FREE' : formatNPR(shippingFee)}</dd></div>
            <div className="flex justify-between font-display text-lg font-black"><dt>Total</dt><dd>{formatNPR(total)}</dd></div>
          </dl>
          <Button onClick={placeOrder} disabled={placing || !valid} className="mt-5 w-full">
            {placing ? 'Placing order…' : `Place order · ${formatNPR(total)}`}
          </Button>
          <label className="mt-3 flex cursor-pointer items-start gap-2 text-[11px] leading-relaxed text-paper/60">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#F06427]"
            />
            <span>
              I agree to the <Link to="/terms" target="_blank" className="font-bold text-paper underline underline-offset-2">Terms of Service</Link>{' '}
              and <Link to="/privacy" target="_blank" className="font-bold text-paper underline underline-offset-2">Privacy Policy</Link>,
              including 7-day exchanges and cash/bank payment confirmation.
            </span>
          </label>
          <p className="mt-2 text-center text-[11px] text-paper/50">Prices & stock re-verified server-side at order time.</p>
        </aside>
      </div>
    </div>
  );
}
