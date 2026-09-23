import { useEffect, useMemo, useState } from 'react';
import { Truck } from 'lucide-react';
import { clsx } from 'clsx';
import { supabase } from '../lib/supabase';
import { logAdminAction as log } from '../lib/admin';
import type { DeliveryPlan, PlanScope, Product } from '../types';
import { formatNPR } from '../lib/shop';
import { Button, Card, Field, Input, Skeleton } from '../components/ui';

interface PlanForm {
  label: string;
  eta: string;
  base_fee: string;
  rate_per_km: string;
  is_active: boolean;
  scope: PlanScope;
  products: string[];
}

const emptyForm = (p: DeliveryPlan): PlanForm => ({
  label: p.label,
  eta: p.eta,
  base_fee: String(p.base_fee),
  rate_per_km: String(p.rate_per_km),
  is_active: p.is_active,
  scope: p.scope,
  products: [...p.products],
});

export default function AdminDelivery({ readOnly }: { readOnly: boolean }) {
  const [plans, setPlans] = useState<DeliveryPlan[]>([]);
  const [forms, setForms] = useState<Record<string, PlanForm>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: links }, { data: prods }] = await Promise.all([
      supabase.from('delivery_plans').select('*').order('sort_order'),
      supabase.from('delivery_plan_products').select('plan_key,product_id'),
      supabase.from('products').select('id,name,slug').eq('is_active', true).order('name').limit(400),
    ]);
    const byPlan = new Map<string, string[]>();
    for (const l of (links ?? []) as { plan_key: string; product_id: string }[]) {
      const arr = byPlan.get(l.plan_key) ?? [];
      arr.push(l.product_id);
      byPlan.set(l.plan_key, arr);
    }
    const list = ((p ?? []) as Omit<DeliveryPlan, 'products'>[]).map((x) => ({
      ...x,
      base_fee: Number(x.base_fee),
      rate_per_km: Number(x.rate_per_km),
      products: byPlan.get(x.key) ?? [],
    }));
    setPlans(list);
    setForms(Object.fromEntries(list.map((x) => [x.key, emptyForm(x)])));
    setProducts((prods ?? []) as unknown as Product[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products.slice(0, 60);
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.slug.includes(q)).slice(0, 60);
  }, [products, search]);

  const save = async (key: string) => {
    if (readOnly) return;
    const f = forms[key];
    if (!f) return;
    const base = Number(f.base_fee);
    const rate = Number(f.rate_per_km);
    if (!f.label.trim()) {
      setMsg('Label is required.');
      return;
    }
    if (Number.isNaN(base) || base < 0 || Number.isNaN(rate) || rate < 0) {
      setMsg('Base fee and Rs/km must be numbers ≥ 0.');
      return;
    }
    setSaving(key);
    setMsg(null);
    const { error } = await supabase.from('delivery_plans').update({
      label: f.label.trim(),
      eta: f.eta.trim(),
      base_fee: base,
      rate_per_km: rate,
      is_active: f.is_active,
      scope: f.scope,
    }).eq('key', key);
    if (error) {
      setMsg(error.message);
      setSaving(null);
      return;
    }
    await supabase.from('delivery_plan_products').delete().eq('plan_key', key);
    if (f.scope !== 'all' && f.products.length > 0) {
      const { error: linkErr } = await supabase.from('delivery_plan_products').insert(
        f.products.map((product_id) => ({ plan_key: key, product_id }))
      );
      if (linkErr) {
        setMsg(linkErr.message);
        setSaving(null);
        return;
      }
    }
    log('deliveryplan.update', 'delivery_plans', key, {
      label: f.label, base, rate, is_active: f.is_active, scope: f.scope, products: f.products.length,
    });
    setMsg(`“${f.label}” saved — checkout uses it immediately.`);
    setSaving(null);
    await load();
  };

  const toggleProduct = (key: string, id: string) => {
    setForms((prev) => {
      const f = prev[key];
      if (!f) return prev;
      const has = f.products.includes(id);
      return { ...prev, [key]: { ...f, products: has ? f.products.filter((x) => x !== id) : [...f.products, id] } };
    });
  };

  if (loading) return <Skeleton className="h-64" />;

  return (
    <div>
      <p className="max-w-2xl text-sm text-ink/60">
        Every plan has its own base fee + Rs/km from Imadol, an on/off switch, and a product scope:
        <strong className="text-ink"> all products</strong>, <strong className="text-ink">only selected</strong>, or
        <strong className="text-ink"> all except selected</strong>. A plan serves a bag only when it covers
        every item in it — enforced server-side at checkout.
      </p>
      {msg && <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-xs ring-1 ring-ink/10">{msg}</p>}

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {plans.map((plan) => {
          const f = forms[plan.key];
          if (!f) return null;
          const example = Math.round(Number(f.base_fee || 0) + 8 * Number(f.rate_per_km || 0));
          return (
            <Card key={plan.key} className="flex h-fit flex-col p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-paper">
                  <Truck size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display font-extrabold">{f.label || plan.key}</h2>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-ink/40">/{plan.key}</p>
                </div>
                <button
                  onClick={() => setForms({ ...forms, [plan.key]: { ...f, is_active: !f.is_active } })}
                  aria-pressed={f.is_active}
                  disabled={readOnly}
                  className={clsx(
                    'relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-60',
                    f.is_active ? 'bg-ember' : 'bg-ink/15'
                  )}
                  aria-label={`${f.is_active ? 'Deactivate' : 'Activate'} ${f.label}`}
                >
                  <span className={clsx(
                    'absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all',
                    f.is_active ? 'left-6' : 'left-1'
                  )} />
                </button>
              </div>

              <fieldset disabled={readOnly} className="mt-4 space-y-3">
                <Field label="Label">
                  <Input value={f.label} onChange={(e) => setForms({ ...forms, [plan.key]: { ...f, label: e.target.value } })} />
                </Field>
                <Field label="ETA text">
                  <Input value={f.eta} onChange={(e) => setForms({ ...forms, [plan.key]: { ...f, eta: e.target.value } })} placeholder="3–5 days" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Base fee (NPR)">
                    <Input type="number" min={0} value={f.base_fee} onChange={(e) => setForms({ ...forms, [plan.key]: { ...f, base_fee: e.target.value } })} />
                  </Field>
                  <Field label="Rs per km">
                    <Input type="number" min={0} value={f.rate_per_km} onChange={(e) => setForms({ ...forms, [plan.key]: { ...f, rate_per_km: e.target.value } })} />
                  </Field>
                </div>
                <p className="rounded-xl bg-paper px-3 py-2 text-xs">
                  Thamel (~8 km) would cost <strong>{formatNPR(example)}</strong>
                  {plan.key === 'standard' ? ' — free over the threshold' : ''}.
                </p>

                <div>
                  <p className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink/60">Applies to</p>
                  <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Product scope">
                    {(['all', 'include', 'exclude'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        role="radio"
                        aria-checked={f.scope === s}
                        onClick={() => setForms({ ...forms, [plan.key]: { ...f, scope: s } })}
                        className={clsx(
                          'rounded-xl border px-2 py-2 text-xs font-bold transition',
                          f.scope === s ? 'border-ink bg-ink text-paper' : 'border-ink/15 bg-white hover:border-ink/40'
                        )}
                      >
                        {s === 'all' ? 'All' : s === 'include' ? 'Selected' : 'All except'}
                      </button>
                    ))}
                  </div>
                </div>

                {f.scope !== 'all' && (
                  <div>
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search products…"
                      aria-label="Search products"
                    />
                    <ul className="mt-2 max-h-44 space-y-1 overflow-y-auto rounded-xl bg-paper p-2">
                      {filteredProducts.map((p) => (
                        <li key={p.id}>
                          <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-white">
                            <input
                              type="checkbox"
                              checked={f.products.includes(p.id)}
                              onChange={() => toggleProduct(plan.key, p.id)}
                              className="h-4 w-4 shrink-0 accent-[#F06427]"
                            />
                            <span className="truncate font-semibold">{p.name}</span>
                          </label>
                        </li>
                      ))}
                      {filteredProducts.length === 0 && (
                        <li className="px-2 py-3 text-xs text-ink/50">No matches.</li>
                      )}
                    </ul>
                    <p className="mt-1 text-[11px] font-semibold text-ink/50">
                      {f.products.length} product{f.products.length === 1 ? '' : 's'} {f.scope === 'include' ? 'included' : 'excluded'}
                    </p>
                  </div>
                )}

                {!readOnly && (
                  <Button onClick={() => void save(plan.key)} disabled={saving === plan.key} className="w-full">
                    {saving === plan.key ? 'Saving…' : `Save ${f.label || plan.key}`}
                  </Button>
                )}
              </fieldset>
            </Card>
          );
        })}
      </div>
      {plans.length === 0 && (
        <p className="mt-4 rounded-2xl bg-white p-6 text-sm text-ink/60 ring-1 ring-ink/10">
          No delivery plans found — run migration <code className="rounded bg-ink/5 px-1">019_delivery_plans.sql</code> to create them.
        </p>
      )}
    </div>
  );
}
