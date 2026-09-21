import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { useCart } from '../store/CartContext';
import { formatNPR } from '../lib/shop';
import { districtOfArea, isGuidedComplete } from '../lib/address';
import { resolveCheckoutPrefill } from '../lib/checkoutProfile';
import { DELIVERY_METHODS, HUB_NAME, deliveryQuote, type DeliveryMethod } from '../lib/delivery';
import { AddressForm } from '../components/AddressForm';
import type { Address } from '../types';
import { useStoreSettings } from '../lib/settings';
import { Button, Field, Input } from '../components/ui';
import { usePageTitle } from '../hooks/usePageTitle';
import { primaryImage } from '../components/product';

interface Addr {
  full_name: string;
  phone: string;
  district: string;
  area: string;
  street: string;
  postal_code: string;
}

const EMPTY: Addr = { full_name: '', phone: '', district: 'Kathmandu', area: '', street: '', postal_code: '' };

export default function CheckoutPage() {
  const { user } = useAuth();
  const { lines, subtotal, clear } = useCart();
  const nav = useNavigate();
  const [addr, setAddr] = useState<Addr>(EMPTY);
  const [saved, setSaved] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<string>('new');
  const [method, setMethod] = useState<'standard' | 'express'>('standard');
  const [notes, setNotes] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  usePageTitle('Checkout');
  // Set when the order succeeds so the empty-cart redirect below doesn't
  // fire after we clear the cart on the way to the success page.
  const placedRef = useRef(false);

  useEffect(() => {
    if (lines.length === 0 && !placedRef.current) nav('/cart', { replace: true });
  }, [lines, nav]);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;
    (async () => {
      const [{ data: addrRows }, { data: prof }] = await Promise.all([
        supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false }),
        supabase
          .from('profiles')
          .select('checkout_name,checkout_phone,checkout_district,checkout_area,checkout_street,checkout_postal,preferred_shipping')
          .eq('id', user.id)
          .single(),
      ]);
      const list = (addrRows ?? []) as Address[];
      setSaved(list);
      // Checkout profile wins; then the address book; then a blank form.
      // Columns are missing entirely before migration 018 runs — default everything.
      const p = (prof ?? {}) as Partial<Record<
        'checkout_name' | 'checkout_phone' | 'checkout_district' |
        'checkout_area' | 'checkout_street' | 'checkout_postal' | 'preferred_shipping',
        string | null
      >>;
      const pre = resolveCheckoutPrefill(
        {
          checkout_name: p.checkout_name ?? '',
          checkout_phone: p.checkout_phone ?? '',
          checkout_district: p.checkout_district ?? '',
          checkout_area: p.checkout_area ?? '',
          checkout_street: p.checkout_street ?? '',
          checkout_postal: p.checkout_postal ?? '',
          preferred_shipping: p.preferred_shipping ?? 'standard',
        },
        list
      );
      setSelectedId(pre.addressId ?? 'new');
      setAddr({
        full_name: pre.full_name,
        phone: pre.phone,
        district: pre.district,
        area: pre.area,
        street: pre.street,
        postal_code: pre.postal_code,
      });
      setMethod(pre.method);
    })();
  }, [user]);

  const pickSaved = (id: string) => {
    setSelectedId(id);
    if (id === 'new') {
      // Keep the typed name/phone — only the address itself resets.
      setAddr((prev) => ({ ...EMPTY, full_name: prev.full_name, phone: prev.phone }));
      return;
    }
    const a = saved.find((x) => x.id === id);
    if (a) {
      setAddr({
        full_name: a.full_name,
        phone: a.phone,
        district: districtOfArea(a.city) ?? 'Kathmandu',
        area: a.city,
        street: a.street,
        postal_code: a.postal_code ?? '',
      });
    }
  };

  const settings = useStoreSettings();
  const quote = deliveryQuote(method, addr.area, subtotal, settings);
  const shippingFee = quote.fee ?? 0;
  const total = subtotal + shippingFee;

  const valid =
    addr.full_name.trim().length >= 2 &&
    addr.phone.trim().length >= 7 &&
    isGuidedComplete({ district: addr.district, area: addr.area, street: addr.street, postal_code: addr.postal_code }) &&
    agreed;

  async function placeOrder() {
    setError(null);
    if (!agreed) {
      setError('Please accept the Terms of Service and Privacy Policy to order.');
      return;
    }
    if (!valid) {
      setError('Please complete name, phone, area and street address.');
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
      // inside place_order(). The order stays `unpaid` until the courier
      // collects cash on delivery.
      const { data, error: rpcError } = await supabase.rpc('place_order', {
        p_items: items,
        p_address: {
          full_name: addr.full_name,
          phone: addr.phone,
          province: 'Bagmati',
          city: addr.area,
          street: `${addr.street} (${addr.district})`,
          postal_code: addr.postal_code || null,
        },
        p_shipping_method: method,
        p_notes: notes,
        p_payment_provider: 'cod',
      });
      if (rpcError) throw new Error(rpcError.message);
      const orderId = data as string;
      placedRef.current = true;
      // Remember everything for next time: the checkout profile (best-effort,
      // never blocks success) plus an address-book entry for first-timers.
      if (user && isSupabaseConfigured) {
        void supabase.from('profiles').update({
          checkout_name: addr.full_name,
          checkout_phone: addr.phone,
          checkout_district: addr.district,
          checkout_area: addr.area,
          checkout_street: addr.street,
          checkout_postal: addr.postal_code || null,
          preferred_shipping: method,
        }).eq('id', user.id);
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
                province: 'Bagmati',
                city: addr.area,
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
            <p className="mt-1 rounded-xl bg-ember/10 px-3 py-2 text-xs font-semibold text-ink/70">
              We currently deliver inside Kathmandu Valley only (Kathmandu, Lalitpur, Bhaktapur).
            </p>
            {saved.length > 0 && (
              <div className="mt-4 grid gap-2" role="radiogroup" aria-label="Choose delivery address">
                {saved.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    role="radio"
                    aria-checked={selectedId === a.id}
                    onClick={() => pickSaved(a.id)}
                    className={`rounded-2xl border p-3.5 text-left text-sm transition ${
                      selectedId === a.id ? 'border-ember bg-ember/5' : 'border-ink/15 hover:border-ink/40'
                    }`}
                  >
                    <span className="font-bold">{a.label} — {a.full_name}</span>
                    <span className="mt-0.5 block text-xs text-ink/60">
                      {a.street}, {a.city}{districtOfArea(a.city) ? `, ${districtOfArea(a.city)}` : ''} · {a.phone}
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedId === 'new'}
                  onClick={() => pickSaved('new')}
                  className={`rounded-2xl border border-dashed p-3.5 text-left text-sm font-bold transition ${
                    selectedId === 'new' ? 'border-ember bg-ember/5 text-ember' : 'border-ink/20 text-ink/60 hover:border-ink/40'
                  }`}
                >
                  + Use a new address
                </button>
              </div>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <Input value={addr.full_name} onChange={(e) => setAddr({ ...addr, full_name: e.target.value })} placeholder="Aashish Sharma" autoComplete="name" maxLength={120} />
              </Field>
              <Field label="Phone">
                <Input value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} placeholder="98XXXXXXXX" autoComplete="tel" maxLength={20} />
              </Field>
            </div>
            <div className="mt-4">
              <AddressForm
                value={{ district: addr.district, area: addr.area, street: addr.street, postal_code: addr.postal_code }}
                onChange={(v) => setAddr({ ...addr, district: v.district, area: v.area, street: v.street, postal_code: v.postal_code })}
              />
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink/5">
            <h2 className="font-display text-lg font-extrabold">Shipping method</h2>
            <p className="mt-1 text-xs text-ink/60">
              Measured from our hub in {HUB_NAME}
              {quote.km !== null ? <> · <strong className="text-ink">{addr.area} is ~{quote.km} km away</strong></> : ' — pick your area above for an exact fee'}.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {DELIVERY_METHODS.map((d) => {
                const disabled = !!d.comingSoon;
                const q = disabled ? null : deliveryQuote(d.method, addr.area, subtotal, settings);
                const selected = !disabled && method === d.method;
                return (
                  <button
                    key={d.method}
                    disabled={disabled}
                    onClick={() => setMethod(d.method as 'standard' | 'express')}
                    aria-pressed={selected}
                    className={`relative rounded-2xl border p-4 text-left transition ${
                      selected ? 'border-ember bg-ember/5' : 'border-ink/15 hover:border-ink/40'
                    } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    {disabled && (
                      <span className="absolute right-3 top-3 rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-paper">
                        Soon
                      </span>
                    )}
                    <p className="font-bold capitalize">{d.label}</p>
                    <p className="text-xs text-ink/50">{d.eta}</p>
                    <p className="mt-1.5 text-sm font-bold text-ember">
                      {disabled
                        ? '—'
                        : q && q.fee !== null
                          ? q.free
                            ? 'FREE'
                            : formatNPR(q.fee)
                          : `Rs ${d.method === 'express' ? settings.deliveryRateExpress : settings.deliveryRateStandard}/km`}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink/5">
            <h2 className="font-display text-lg font-extrabold">Payment</h2>
            <div className="mt-3 rounded-2xl border border-ember bg-ember/5 p-4">
              <p className="font-bold">Cash on Delivery</p>
              <p className="mt-1 text-xs leading-relaxed text-ink/60">
                Pay in cash when your order arrives — Kathmandu, Lalitpur or Bhaktapur.
                No online payments, no advance. Your order stays <strong>unpaid</strong> until
                our courier collects it.
              </p>
            </div>
            <div className="mt-4">
              <Field label="Order notes (optional)">
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gate code, landmarks, delivery timing…" maxLength={1000} />
              </Field>
            </div>
          </section>

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-800">{error}</div>}
        </div>

        <aside className="glass-dark h-fit rounded-2xl p-6 text-paper lg:sticky lg:top-32">
          <h2 className="font-display text-lg font-extrabold">Order summary</h2>
          <ul className="mt-4 space-y-3">
            {lines.map((l) => (
              <li key={`${l.product.id}-${l.variant?.id}`} className="flex items-center gap-3">
                <img src={primaryImage(l.product, 100)} alt="" className="h-12 w-12 rounded-lg object-cover" loading="lazy" />
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
              including 7-day exchanges and cash payment on delivery.
            </span>
          </label>
          <p className="mt-2 text-center text-[11px] text-paper/50">Prices & stock re-verified server-side at order time.</p>
        </aside>
      </div>
    </div>
  );
}
