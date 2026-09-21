import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Category, Drop, Order, Product, ProductVariant, Profile, Review } from '../types';
import { dropState } from '../types';
import { formatNPR } from '../lib/shop';
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, Input, Skeleton } from '../components/ui';
import { ImageManager } from '../components/ImageManager';

const TABS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/drops', label: 'Drops' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/logs', label: 'Activity' },
];

function log(action: string, entity: string, entity_id?: string, meta: object = {}) {
  // Best-effort audit trail; failures never block the admin action.
  supabase.from('admin_logs').insert({ action, entity, entity_id, meta }).then(() => undefined);
}

export default function AdminPage() {
  return (
    <div className="bg-paper">
      <div className="border-b border-ink/10 bg-ink text-paper">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ember font-display text-sm font-black text-white">DX</span>
          <div>
            <h1 className="font-display text-lg font-black leading-none">DropX Admin</h1>
            <p className="text-[11px] text-paper/60">Enforced server-side by Supabase RLS · every write is audited</p>
          </div>
          <Link to="/" className="ml-auto rounded-full border border-paper/20 px-4 py-1.5 text-xs font-bold hover:border-paper/50">
            ← Storefront
          </Link>
        </div>
        <nav className="no-scrollbar mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-3" aria-label="Admin sections">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold ${isActive ? 'bg-ember text-white' : 'bg-paper/10 text-paper/80 hover:bg-paper/20'}`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Routes>
          <Route index element={<Overview />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="orders" element={<Orders />} />
          <Route path="customers" element={<Customers />} />
          <Route path="drops" element={<Drops />} />
          <Route path="reviews" element={<ReviewsMod />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="logs" element={<Logs />} />
        </Routes>
      </div>
    </div>
  );
}

/* ─── Overview ─── */
function Overview() {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, customers: 0, lowStock: 0 as number | { name: string; stock: number }[] });
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState<Order[]>([]);

  useEffect(() => {
    (async () => {
      const [p, o, c, v] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact' }),
        supabase.from('orders').select('id,grand_total,payment_status').neq('status', 'cancelled'),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'customer'),
        supabase.from('product_variants').select('name,stock').lt('stock', 6).limit(8),
      ]);
      const rev = ((o.data ?? []) as { grand_total: number; payment_status: string }[])
        .filter((x) => x.payment_status === 'paid')
        .reduce((s, x) => s + Number(x.grand_total), 0);
      setStats({
        products: p.count ?? 0,
        orders: o.count ?? (o.data?.length ?? 0),
        revenue: rev,
        customers: c.count ?? 0,
        lowStock: ((v.data ?? []) as { name: string; stock: number }[]),
      });
      const { data: r } = await supabase.from('orders').select('*').order('placed_at', { ascending: false }).limit(5);
      setRecent((r ?? []) as Order[]);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Skeleton className="h-48" />;
  const cards = [
    { label: 'Products', value: String(stats.products) },
    { label: 'Orders', value: String(stats.orders) },
    { label: 'Paid revenue', value: formatNPR(stats.revenue) },
    { label: 'Customers', value: String(stats.customers) },
  ];
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-ink/50">{c.label}</p>
            <p className="mt-1 font-display text-2xl font-black">{c.value}</p>
          </Card>
        ))}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display font-extrabold">Low stock alerts</h2>
          {(stats.lowStock as { name: string; stock: number }[]).length === 0 ? (
            <p className="mt-2 text-sm text-ink/60">All variants healthy.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {(stats.lowStock as { name: string; stock: number }[]).map((v, i) => (
                <li key={i} className="flex justify-between rounded-lg bg-paper px-3 py-2">
                  <span>{v.name}</span>
                  <Badge tone={v.stock === 0 ? 'red' : 'ember'}>{v.stock} left</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="font-display font-extrabold">Recent orders</h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            {recent.length === 0 && <li className="text-ink/60">No orders yet.</li>}
            {recent.map((o) => (
              <li key={o.id} className="flex items-center justify-between rounded-lg bg-paper px-3 py-2">
                <span className="font-bold">{o.order_number}</span>
                <span className="text-ink/60">{formatNPR(o.grand_total)}</span>
                <Badge>{o.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

/* ─── Products ─── */
const EMPTY_PRODUCT = { name: '', slug: '', description: '', category_id: '', base_price: '', compare_at_price: '', is_active: true, is_featured: false, is_trending: false, is_new: true };

function Products() {
  const [items, setItems] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [vForm, setVForm] = useState({ name: '', sku: '', size: '', color: '', price_adjustment: '0', stock: '10' });

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('products').select('*, category:categories(*), variants:product_variants(*)').order('created_at', { ascending: false }).limit(200),
      supabase.from('categories').select('*').order('sort_order'),
    ]);
    setItems((p ?? []) as unknown as Product[]);
    setCats((c ?? []) as Category[]);
    setLoading(false);
  };
  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(
    () => items.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.slug.includes(q.toLowerCase())),
    [items, q]
  );

  const startEdit = async (p?: Product) => {
    if (!p) {
      setEditing('new');
      setForm(EMPTY_PRODUCT);
      setVariants([]);
      return;
    }
    setEditing(p.id);
    setForm({
      name: p.name, slug: p.slug, description: p.description,
      category_id: p.category_id ?? '', base_price: String(p.base_price),
      compare_at_price: p.compare_at_price ? String(p.compare_at_price) : '',
      is_active: p.is_active, is_featured: p.is_featured, is_trending: p.is_trending, is_new: p.is_new,
    });
    const { data } = await supabase.from('product_variants').select('*').eq('product_id', p.id).order('created_at');
    setVariants((data ?? []) as ProductVariant[]);
  };

  const save = async () => {
    if (!form.name.trim() || !form.slug.trim() || Number(form.base_price) < 0) {
      setMsg('Name, slug and a valid price are required.');
      return;
    }
    setSaving(true);
    setMsg(null);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      description: form.description,
      category_id: form.category_id || null,
      base_price: Number(form.base_price),
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      is_active: form.is_active, is_featured: form.is_featured,
      is_trending: form.is_trending, is_new: form.is_new,
    };
    if (editing === 'new') {
      const { data, error } = await supabase.from('products').insert(payload).select().single();
      if (error) setMsg(error.message);
      else {
        log('product.create', 'products', (data as Product).id, { name: payload.name });
        setEditing(null);
        await load();
      }
    } else if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing);
      if (error) setMsg(error.message);
      else {
        log('product.update', 'products', editing, { name: payload.name });
        setEditing(null);
        await load();
      }
    }
    setSaving(false);
  };

  const addVariant = async () => {
    if (!editing || editing === 'new' || !vForm.name.trim() || !vForm.sku.trim()) {
      setMsg('Variant needs a name and SKU.');
      return;
    }
    const { error } = await supabase.from('product_variants').insert({
      product_id: editing,
      name: vForm.name.trim(), sku: vForm.sku.trim().toUpperCase(),
      size: vForm.size || null, color: vForm.color || null,
      price_adjustment: Number(vForm.price_adjustment) || 0,
      stock: Math.max(0, Number(vForm.stock) || 0),
    });
    if (error) setMsg(error.message);
    else {
      log('variant.create', 'product_variants', undefined, { sku: vForm.sku });
      const { data } = await supabase.from('product_variants').select('*').eq('product_id', editing).order('created_at');
      setVariants((data ?? []) as ProductVariant[]);
      setVForm({ name: '', sku: '', size: '', color: '', price_adjustment: '0', stock: '10' });
    }
  };

  if (loading) return <Skeleton className="h-64" />;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="max-w-xs" aria-label="Search products" />
        <Button onClick={() => void startEdit(undefined)} className="ml-auto">+ New product</Button>
      </div>

      {editing && (
        <Card className="mt-4 p-6">
          <h2 className="font-display text-lg font-extrabold">{editing === 'new' ? 'New product' : 'Edit product'}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Slug"><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
            <div className="md:col-span-2">
              <Field label="Description">
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm" />
              </Field>
            </div>
            <Field label="Category">
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm">
                <option value="">— None —</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Base price (NPR)"><Input type="number" min={0} value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} /></Field>
              <Field label="Compare-at (optional)"><Input type="number" min={0} value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })} /></Field>
            </div>
            <div className="flex flex-wrap gap-4 text-sm md:col-span-2">
              {(['is_active', 'is_featured', 'is_trending', 'is_new'] as const).map((k) => (
                <label key={k} className="flex items-center gap-2 font-medium">
                  <input type="checkbox" checked={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.checked })} className="h-4 w-4 accent-[#F06427]" />
                  {k.replace('is_', '')}
                </label>
              ))}
            </div>
          </div>
          {msg && <p className="mt-3 text-xs text-red-700">{msg}</p>}
          <div className="mt-4 flex gap-2">
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save product'}</Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
          </div>

          {editing !== 'new' && (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div>
                <h3 className="font-bold">Variants & inventory</h3>
                <ul className="mt-2 space-y-2">
                  {variants.map((v) => (
                    <li key={v.id} className="flex items-center gap-2 rounded-xl bg-paper px-3 py-2 text-sm">
                      <span className="min-w-0 flex-1"><strong>{v.name}</strong> <span className="text-ink/50">· {v.sku} · stock {v.stock}</span></span>
                      <button
                        className="rounded-lg bg-ink px-2 py-1 text-[11px] font-bold text-paper"
                        onClick={() => {
                          const s = prompt('New stock quantity:', String(v.stock));
                          if (s === null) return;
                          const n = Math.max(0, Number(s) || 0);
                          supabase.from('product_variants').update({ stock: n }).eq('id', v.id).then(() => {
                            log('variant.stock', 'product_variants', v.id, { stock: n });
                            setVariants(variants.map((x) => (x.id === v.id ? { ...x, stock: n } : x)));
                          });
                        }}
                      >
                        Set stock
                      </button>
                      <button
                        className="rounded-lg bg-red-100 px-2 py-1 text-[11px] font-bold text-red-700"
                        onClick={() => {
                          if (!confirm(`Delete variant ${v.sku}?`)) return;
                          supabase.from('product_variants').delete().eq('id', v.id).then(() => {
                            log('variant.delete', 'product_variants', v.id, {});
                            setVariants(variants.filter((x) => x.id !== v.id));
                          });
                        }}
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                  {variants.length === 0 && <li className="text-xs text-ink/50">No variants — add at least one so checkout can verify stock.</li>}
                </ul>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Input placeholder="Name (M / Black)" value={vForm.name} onChange={(e) => setVForm({ ...vForm, name: e.target.value })} />
                  <Input placeholder="SKU" value={vForm.sku} onChange={(e) => setVForm({ ...vForm, sku: e.target.value })} />
                  <Input placeholder="Size" value={vForm.size} onChange={(e) => setVForm({ ...vForm, size: e.target.value })} />
                  <Input placeholder="Color" value={vForm.color} onChange={(e) => setVForm({ ...vForm, color: e.target.value })} />
                  <Input placeholder="+ NPR adj." type="number" value={vForm.price_adjustment} onChange={(e) => setVForm({ ...vForm, price_adjustment: e.target.value })} />
                  <Input placeholder="Stock" type="number" min={0} value={vForm.stock} onChange={(e) => setVForm({ ...vForm, stock: e.target.value })} />
                </div>
                <Button variant="dark" className="mt-2" onClick={addVariant}>Add variant</Button>
              </div>
              <ImageManager productId={editing} />
            </div>
          )}
        </Card>
      )}

      <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-card ring-1 ring-ink/5">
        <table className="w-full min-w-[42rem] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-xs uppercase tracking-wider text-ink/50">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Flags</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const stock = (p.variants ?? []).reduce((s, v) => s + v.stock, 0);
              return (
                <tr key={p.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-bold">{p.name}</p>
                    <p className="text-xs text-ink/50">{p.slug} · {p.category?.name ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3">{formatNPR(p.base_price)}</td>
                  <td className="px-4 py-3"><Badge tone={stock === 0 ? 'red' : stock < 10 ? 'ember' : 'green'}>{stock}</Badge></td>
                  <td className="px-4 py-3">
                    <span className="flex gap-1">
                      {!p.is_active && <Badge tone="red">hidden</Badge>}
                      {p.is_trending && <Badge>hot</Badge>}
                      {p.is_new && <Badge tone="ink">new</Badge>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => void startEdit(p)} className="rounded-full bg-ink/5 px-3 py-1.5 text-xs font-bold hover:bg-ink/10">Edit</button>{' '}
                    <button onClick={() => setConfirmDel(p)} className="rounded-full bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700">Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8"><EmptyState title="No products" body="Create your first product to start selling." /></div>}
      </div>

      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        title="Delete product?"
        body={`“${confirmDel?.name}” and its variants will be permanently removed. Order snapshots are preserved. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (!confirmDel) return;
          supabase.from('products').delete().eq('id', confirmDel.id).then(() => {
            log('product.delete', 'products', confirmDel.id, {});
            setItems(items.filter((i) => i.id !== confirmDel.id));
          });
        }}
      />
    </div>
  );
}

/* ─── Categories ─── */
function Categories() {
  const [items, setItems] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    setItems((data ?? []) as Category[]);
  };
  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <Card className="h-fit p-5">
        <h2 className="font-display font-extrabold">New category</h2>
        <div className="mt-3 space-y-3">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Slug"><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from name" /></Field>
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm" />
          </Field>
          {msg && <p className="text-xs text-red-700">{msg}</p>}
          <Button
            className="w-full"
            onClick={() => {
              const name = form.name.trim();
              if (!name) {
                setMsg('Name is required.');
                return;
              }
              const slug = (form.slug.trim() || name).toLowerCase().replace(/\s+/g, '-');
              supabase.from('categories').insert({ name, slug, description: form.description, sort_order: items.length })
                .then(({ error }) => {
                  if (error) setMsg(error.message);
                  else {
                    log('category.create', 'categories', undefined, { name });
                    setForm({ name: '', slug: '', description: '' });
                    void load();
                  }
                });
            }}
          >
            Create category
          </Button>
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="font-display font-extrabold">Categories ({items.length})</h2>
        <ul className="mt-3 space-y-2">
          {items.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-xl bg-paper px-4 py-3 text-sm">
              <span className="flex-1"><strong>{c.name}</strong> <span className="text-ink/50">· /{c.slug}</span></span>
              <button
                className="text-xs font-bold text-ink/50 hover:text-ink"
                onClick={() => {
                  supabase.from('categories').update({ is_active: !c.is_active }).eq('id', c.id).then(() => {
                    log('category.toggle', 'categories', c.id, { is_active: !c.is_active });
                    void load();
                  });
                }}
              >
                {c.is_active ? 'Hide' : 'Show'}
              </button>
              <button
                className="text-xs font-bold text-red-600"
                onClick={() => {
                  if (!confirm(`Delete category “${c.name}”? Products become uncategorized.`)) return;
                  supabase.from('categories').delete().eq('id', c.id).then(() => {
                    log('category.delete', 'categories', c.id, {});
                    void load();
                  });
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ─── Orders ─── */
function Orders() {
  const [items, setItems] = useState<Order[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  const load = async () => {
    setLoading(true);
    let q = supabase.from('orders').select('*, items:order_items(*)').order('placed_at', { ascending: false }).limit(100);
    if (filter && filter !== 'all-pay') q = q.eq('status', filter);
    if (filter === 'all-pay') q = supabase.from('orders').select('*, items:order_items(*)').eq('payment_status', 'pending_verification').order('placed_at', { ascending: false }).limit(100);
    const { data } = await q;
    setItems((data ?? []) as unknown as Order[]);
    setLoading(false);
  };
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const setStatus = async (o: Order, status: Order['status']) => {
    const { error } = await supabase.rpc('admin_set_order_status', { p_order: o.id, p_status: status });
    if (!error) {
      setItems(items.map((x) => (x.id === o.id ? { ...x, status } : x)));
      log('order.status', 'orders', o.id, { status });
    }
  };

  const markPaid = async (o: Order) => {
    const ref = prompt(`Confirm verified payment reference for ${o.order_number} (provider receipt/transaction id):`);
    if (!ref?.trim()) return;
    const { error } = await supabase.rpc('mark_order_paid', {
      p_order: o.id,
      p_provider: o.payment_provider ?? 'manual',
      p_ref: ref.trim(),
    });
    if (error) alert(error.message);
    else {
      log('order.paid', 'orders', o.id, { ref });
      void load();
    }
  };

  if (loading) return <Skeleton className="h-64" />;
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'all-pay'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${filter === s ? 'bg-ink text-paper' : 'bg-white ring-1 ring-ink/10'}`}
          >
            {s === '' ? 'All' : s === 'all-pay' ? 'Needs payment check' : s}
          </button>
        ))}
        <button onClick={() => void load()} className="ml-auto rounded-full bg-white px-3.5 py-1.5 text-xs font-bold ring-1 ring-ink/10">Refresh</button>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((o) => (
          <Card key={o.id} className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => nav(`/orders/${o.id}`)} className="font-display font-extrabold hover:text-ember">{o.order_number}</button>
              <Badge>{o.status}</Badge>
              <Badge tone="paper">{o.payment_status.replace('_', ' ')}</Badge>
              <span className="ml-auto text-sm font-bold">{formatNPR(o.grand_total)}</span>
            </div>
            <p className="mt-1 text-xs text-ink/60">
              {o.shipping_name} · {o.shipping_phone} · {o.shipping_city}, {o.shipping_province} · {new Date(o.placed_at).toLocaleString('en-NP')}
            </p>
            <p className="mt-1 text-xs text-ink/60">
              {(o.items ?? []).map((i) => `${i.product_name} ×${i.quantity}`).join(' · ')}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <select
                value={o.status}
                onChange={(e) => void setStatus(o, e.target.value as Order['status'])}
                className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs font-bold"
                aria-label="Order status"
              >
                {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {o.payment_status !== 'paid' && (
                <button onClick={() => void markPaid(o)} className="rounded-full bg-ember px-3.5 py-1.5 text-xs font-bold text-white">
                  Mark paid (verified ref required)
                </button>
              )}
            </div>
          </Card>
        ))}
        {items.length === 0 && <EmptyState title="No orders" body="Orders will appear here as customers check out." />}
      </div>
    </div>
  );
}

/* ─── Customers ─── */
function Customers() {
  const [items, setItems] = useState<Profile[]>([]);
  const [q, setQ] = useState('');
  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(200)
      .then(({ data }) => setItems((data ?? []) as Profile[]));
  }, []);
  const filtered = items.filter((p) => !q || p.email.includes(q) || (p.full_name ?? '').toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by email or name…" className="max-w-xs" aria-label="Search customers" />
      <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-card ring-1 ring-ink/5">
        <table className="w-full min-w-[42rem] text-left text-sm">
          <thead><tr className="border-b border-ink/10 text-xs uppercase tracking-wider text-ink/50">
            <th className="px-4 py-3">Customer</th><th className="px-4 py-3">Role</th><th className="px-4 py-3 text-right">Action</th>
          </tr></thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3"><p className="font-bold">{p.full_name || '—'}</p><p className="text-xs text-ink/50">{p.email} · {p.phone ?? 'no phone'}</p></td>
                <td className="px-4 py-3"><Badge tone={p.role === 'customer' ? 'paper' : 'ember'}>{p.role}</Badge></td>
                <td className="px-4 py-3 text-right">
                  <select
                    value={p.role}
                    onChange={(e) => {
                      const role = e.target.value;
                      if (!confirm(`Change ${p.email} role to ${role}?`)) return;
                      supabase.from('profiles').update({ role }).eq('id', p.id).then(({ error }) => {
                        if (!error) {
                          log('customer.role', 'profiles', p.id, { role });
                          setItems(items.map((x) => (x.id === p.id ? { ...x, role: role as Profile['role'] } : x)));
                        }
                      });
                    }}
                    className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-bold"
                    aria-label="Customer role"
                  >
                    <option value="customer">customer</option>
                    <option value="admin">admin</option>
                    <option value="superadmin">superadmin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Drops ─── */
const EMPTY_DROP = { kind: 'monthly' as Drop['kind'], title: '', slug: '', description: '', artwork_url: '', theme_color: '#F06427', starts_at: '', ends_at: '', hero_label: '', is_published: false };

function Drops() {
  const [items, setItems] = useState<Drop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_DROP);
  const [links, setLinks] = useState<{ product_id: string; badge: string }[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    const [{ data: d }, { data: p }] = await Promise.all([
      supabase.from('drops').select('*').order('starts_at', { ascending: false }),
      supabase.from('products').select('id,name,slug').eq('is_active', true).order('name').limit(300),
    ]);
    setItems((d ?? []) as Drop[]);
    setProducts((p ?? []) as unknown as Product[]);
  };
  useEffect(() => {
    void load();
  }, []);

  const startEdit = async (d?: Drop) => {
    if (!d) {
      setEditing('new');
      setForm({ ...EMPTY_DROP, starts_at: new Date().toISOString().slice(0, 16), ends_at: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 16) });
      setLinks([]);
      return;
    }
    setEditing(d.id);
    setForm({
      kind: d.kind, title: d.title, slug: d.slug, description: d.description,
      artwork_url: d.artwork_url ?? '', theme_color: d.theme_color,
      starts_at: new Date(d.starts_at).toISOString().slice(0, 16),
      ends_at: new Date(d.ends_at).toISOString().slice(0, 16),
      hero_label: d.hero_label, is_published: d.is_published,
    });
    const { data } = await supabase.from('drop_products').select('product_id,badge').eq('drop_id', d.id).order('sort_order');
    setLinks(((data ?? []) as { product_id: string; badge: string }[]));
  };

  const save = async () => {
    if (!form.title.trim() || !form.slug.trim()) {
      setMsg('Title and slug are required.');
      return;
    }
    if (new Date(form.ends_at) <= new Date(form.starts_at)) {
      setMsg('End date must be after start date.');
      return;
    }
    const payload = {
      kind: form.kind,
      title: form.title.trim(),
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      description: form.description,
      artwork_url: form.artwork_url || null,
      theme_color: form.theme_color,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: new Date(form.ends_at).toISOString(),
      hero_label: form.hero_label || (form.kind === 'mega' ? 'MEGA DROP OF THE YEAR' : 'DROP OF THE MONTH'),
      is_published: form.is_published,
    };
    let dropId = editing;
    if (editing === 'new') {
      const { data, error } = await supabase.from('drops').insert(payload).select().single();
      if (error) {
        setMsg(error.message);
        return;
      }
      dropId = (data as Drop).id;
      log('drop.create', 'drops', dropId!, { title: payload.title });
    } else if (editing) {
      const { error } = await supabase.from('drops').update(payload).eq('id', editing);
      if (error) {
        setMsg(error.message);
        return;
      }
      log('drop.update', 'drops', editing, { title: payload.title });
    }
    if (dropId && dropId !== 'new') {
      await supabase.from('drop_products').delete().eq('drop_id', dropId);
      if (links.length > 0) {
        await supabase.from('drop_products').insert(
          links.map((l, i) => ({ drop_id: dropId, product_id: l.product_id, sort_order: i, badge: l.badge }))
        );
      }
    }
    setEditing(null);
    setMsg(null);
    await load();
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <p className="text-sm text-ink/60">Monthly + Mega drops power the homepage. States derive from dates — no hardcoded promos.</p>
        <Button onClick={() => void startEdit(undefined)} className="ml-auto">+ New drop</Button>
      </div>

      {editing && (
        <Card className="mt-4 p-6">
          <h2 className="font-display text-lg font-extrabold">{editing === 'new' ? 'New drop' : 'Edit drop'}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Kind">
              <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as Drop['kind'] })} className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm">
                <option value="monthly">Drop of the Month</option>
                <option value="mega">Mega Drop of the Year</option>
              </select>
            </Field>
            <Field label="Published?">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="h-4 w-4 accent-[#F06427]" />
                Visible on storefront
              </label>
            </Field>
            <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            <Field label="Slug"><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
            <div className="md:col-span-2">
              <Field label="Description">
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm" />
              </Field>
            </div>
            <Field label="Artwork URL (Cloudinary)"><Input value={form.artwork_url} onChange={(e) => setForm({ ...form, artwork_url: e.target.value })} placeholder="https://res.cloudinary.com/…/mega.jpg" /></Field>
            <Field label="Hero label"><Input value={form.hero_label} onChange={(e) => setForm({ ...form, hero_label: e.target.value })} placeholder="DROP OF THE MONTH" /></Field>
            <Field label="Starts at"><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></Field>
            <Field label="Ends at"><Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></Field>
          </div>

          <div className="mt-4">
            <h3 className="font-bold">Curated products</h3>
            <ul className="mt-2 space-y-1.5">
              {links.map((l, i) => (
                <li key={l.product_id} className="flex items-center gap-2 rounded-xl bg-paper px-3 py-2 text-sm">
                  <span className="flex-1 font-semibold">{products.find((p) => p.id === l.product_id)?.name ?? l.product_id}</span>
                  <input value={l.badge} onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, badge: e.target.value } : x)))} placeholder="Badge" className="w-28 rounded-lg border border-ink/15 px-2 py-1 text-xs" />
                  <button onClick={() => setLinks(links.filter((_, j) => j !== i))} className="text-xs font-bold text-red-600">Remove</button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <select id="drop-product-pick" className="flex-1 rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm" defaultValue="">
                <option value="" disabled>Add product…</option>
                {products.filter((p) => !links.some((l) => l.product_id === p.id)).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <Button
                variant="dark"
                onClick={() => {
                  const el = document.getElementById('drop-product-pick') as HTMLSelectElement | null;
                  if (el?.value) setLinks([...links, { product_id: el.value, badge: '' }]);
                }}
              >
                Add
              </Button>
            </div>
          </div>

          {msg && <p className="mt-3 text-xs text-red-700">{msg}</p>}
          <div className="mt-4 flex gap-2">
            <Button onClick={save}>Save drop</Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </Card>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map((d) => (
          <Card key={d.id} className="p-5">
            <div className="flex items-center gap-2">
              <Badge tone={d.kind === 'mega' ? 'ink' : 'ember'}>{d.kind === 'mega' ? 'Mega' : 'Monthly'}</Badge>
              <Badge tone={dropState(d) === 'active' ? 'green' : dropState(d) === 'upcoming' ? 'paper' : 'red'}>{dropState(d)}</Badge>
              {!d.is_published && <Badge tone="red">draft</Badge>}
            </div>
            <p className="mt-2 font-display text-lg font-extrabold">{d.title}</p>
            <p className="text-xs text-ink/50">{new Date(d.starts_at).toLocaleDateString()} → {new Date(d.ends_at).toLocaleDateString()} · /{d.slug}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => void startEdit(d)} className="rounded-full bg-ink/5 px-3.5 py-1.5 text-xs font-bold">Edit</button>
              <button
                onClick={() => {
                  if (!confirm(`Delete drop “${d.title}”?`)) return;
                  supabase.from('drops').delete().eq('id', d.id).then(() => {
                    log('drop.delete', 'drops', d.id, {});
                    setItems(items.filter((x) => x.id !== d.id));
                  });
                }}
                className="rounded-full bg-red-100 px-3.5 py-1.5 text-xs font-bold text-red-700"
              >
                Delete
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── Reviews moderation ─── */
function ReviewsMod() {
  const [items, setItems] = useState<(Review & { product_name?: string })[]>([]);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const load = async () => {
    let q = supabase.from('reviews').select('*, products:product_id(name)').order('created_at', { ascending: false }).limit(100);
    if (filter === 'pending') q = q.eq('is_approved', false);
    const { data } = await q;
    setItems(((data ?? []) as unknown as Array<Review & { products: { name: string } | null }>).map((r) => ({ ...r, product_name: r.products?.name })));
  };
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);
  return (
    <div>
      <div className="flex gap-2">
        {(['pending', 'all'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-xs font-bold ${filter === f ? 'bg-ink text-paper' : 'bg-white ring-1 ring-ink/10'}`}>{f}</button>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {items.map((r) => (
          <Card key={r.id} className="p-4">
            <p className="text-sm"><strong>{r.product_name}</strong> · {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</p>
            {r.title && <p className="mt-1 font-bold">{r.title}</p>}
            <p className="text-sm text-ink/70">{r.body}</p>
            <div className="mt-2 flex gap-2">
              {!r.is_approved && (
                <button
                  onClick={() => supabase.from('reviews').update({ is_approved: true }).eq('id', r.id).then(() => { log('review.approve', 'reviews', r.id, {}); void load(); })}
                  className="rounded-full bg-ember px-3.5 py-1.5 text-xs font-bold text-white"
                >
                  Approve
                </button>
              )}
              <button
                onClick={() => {
                  if (!confirm('Delete this review?')) return;
                  supabase.from('reviews').delete().eq('id', r.id).then(() => { log('review.delete', 'reviews', r.id, {}); void load(); });
                }}
                className="rounded-full bg-red-100 px-3.5 py-1.5 text-xs font-bold text-red-700"
              >
                Delete
              </button>
            </div>
          </Card>
        ))}
        {items.length === 0 && <EmptyState title="All clear" body="No reviews awaiting moderation." />}
      </div>
    </div>
  );
}

/* ─── Analytics ─── */
function Analytics() {
  const [rows, setRows] = useState<{ month: string; revenue: number; orders: number }[]>([]);
  const [top, setTop] = useState<{ name: string; qty: number; revenue: number }[]>([]);
  useEffect(() => {
    (async () => {
      const { data: orders } = await supabase.from('orders').select('grand_total,placed_at,payment_status').neq('status', 'cancelled').limit(500);
      const byMonth = new Map<string, { revenue: number; orders: number }>();
      for (const o of (orders ?? []) as { grand_total: number; placed_at: string; payment_status: string }[]) {
        const m = new Date(o.placed_at).toISOString().slice(0, 7);
        const e = byMonth.get(m) ?? { revenue: 0, orders: 0 };
        e.orders += 1;
        if (o.payment_status === 'paid') e.revenue += Number(o.grand_total);
        byMonth.set(m, e);
      }
      setRows([...byMonth.entries()].map(([month, v]) => ({ month, ...v })).sort((a, b) => b.month.localeCompare(a.month)).slice(0, 6));
      const { data: items } = await supabase.from('order_items').select('product_name,quantity,line_total').limit(500);
      const byProduct = new Map<string, { qty: number; revenue: number }>();
      for (const i of (items ?? []) as { product_name: string; quantity: number; line_total: number }[]) {
        const e = byProduct.get(i.product_name) ?? { qty: 0, revenue: 0 };
        e.qty += i.quantity;
        e.revenue += Number(i.line_total);
        byProduct.set(i.product_name, e);
      }
      setTop([...byProduct.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.qty - a.qty).slice(0, 8));
    })();
  }, []);
  const maxRev = Math.max(1, ...rows.map((r) => r.revenue));
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="p-5">
        <h2 className="font-display font-extrabold">Revenue by month (paid orders)</h2>
        <ul className="mt-3 space-y-2">
          {rows.map((r) => (
            <li key={r.month} className="text-sm">
              <span className="flex justify-between"><strong>{r.month}</strong><span>{formatNPR(r.revenue)} · {r.orders} orders</span></span>
              <span className="mt-1 block h-2 overflow-hidden rounded-full bg-ink/10">
                <span className="block h-full rounded-full bg-ember" style={{ width: `${(r.revenue / maxRev) * 100}%` }} />
              </span>
            </li>
          ))}
          {rows.length === 0 && <li className="text-sm text-ink/60">No data yet.</li>}
        </ul>
      </Card>
      <Card className="p-5">
        <h2 className="font-display font-extrabold">Top products (units)</h2>
        <ul className="mt-3 space-y-1.5 text-sm">
          {top.map((t) => (
            <li key={t.name} className="flex justify-between rounded-lg bg-paper px-3 py-2">
              <span className="font-semibold">{t.name}</span>
              <span className="text-ink/60">{t.qty} sold · {formatNPR(t.revenue)}</span>
            </li>
          ))}
          {top.length === 0 && <li className="text-ink/60">No data yet.</li>}
        </ul>
      </Card>
    </div>
  );
}

/* ─── Activity logs ─── */
function Logs() {
  const [items, setItems] = useState<{ id: string; action: string; entity: string; entity_id: string | null; created_at: string }[]>([]);
  useEffect(() => {
    supabase.from('admin_logs').select('id,action,entity,entity_id,created_at').order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => setItems((data ?? []) as typeof items));
  }, []);
  return (
    <Card className="p-5">
      <h2 className="font-display font-extrabold">Administrative activity</h2>
      <ul className="mt-3 space-y-1.5 text-sm">
        {items.map((l) => (
          <li key={l.id} className="flex flex-wrap gap-2 rounded-lg bg-paper px-3 py-2">
            <Badge tone="ink">{l.action}</Badge>
            <span className="text-ink/60">{l.entity}{l.entity_id ? ` · ${l.entity_id.slice(0, 8)}…` : ''}</span>
            <span className="ml-auto text-xs text-ink/40">{new Date(l.created_at).toLocaleString('en-NP')}</span>
          </li>
        ))}
        {items.length === 0 && <li className="text-ink/60">No activity recorded yet.</li>}
      </ul>
    </Card>
  );
}
