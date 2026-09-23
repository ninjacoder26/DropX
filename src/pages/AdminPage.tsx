import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import {
  BarChart3, Bell, ClipboardList, Flame, Images, KeyRound, LayoutDashboard, Menu, Moon, Package,
  ScrollText, Settings as SettingsIcon, Star, Sun, Tags, Truck, Users, X, Zap,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAdminTheme } from '../lib/adminTheme';
import { useAuth } from '../store/AuthContext';
import { isRealtimeAvailable } from '../lib/realtime';
import { logAdminAction as log } from '../lib/admin';
import AdminDelivery from './AdminDelivery';
import AdminDemand from './AdminDemand';
import AdminImageRequests from './AdminImageRequests';
import { supabase } from '../lib/supabase';
import type { Category, Drop, Order, Product, ProductVariant, Profile, Review } from '../types';
import { dropState } from '../types';
import { formatNPR } from '../lib/shop';
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, Input, Skeleton } from '../components/ui';
import { ImageManager } from '../components/ImageManager';
import { CloudinaryUpload } from '../components/CloudinaryUpload';
import { PRODUCT_CSV_HEADERS, parseCSV, slugify, toCSV, validateProductRows } from '../lib/csv';
import { MAX_TAGS_PER_PRODUCT, TAG_VOCABULARY } from '../lib/tags';
import { fetchSettings, costFromSelling, sellingFromCost } from '../lib/settings';
import { validateStaffPassword, validateStaffUsername } from '../lib/staff';
import { ADMIN_CANCEL_REASONS, buildCancelReason } from '../lib/orderCancel';
import { CancelOrderBox } from '../components/CancelOrderBox';
import { primaryImage } from '../components/product';
import { usePageTitle } from '../hooks/usePageTitle';

const TABS = [
  { to: '/admin', label: 'Overview', end: true, icon: LayoutDashboard },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/delivery', label: 'Delivery', icon: Truck },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/staff', label: 'Staff', icon: KeyRound },
  { to: '/admin/drops', label: 'Drops', icon: Zap },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/image-requests', label: 'Images', icon: Images },
  { to: '/admin/demand', label: 'Demand', icon: Flame },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
  { to: '/admin/logs', label: 'Activity', icon: ScrollText },
];

export default function AdminPage() {
  const [drawer, setDrawer] = useState(false);
  const { theme, toggle } = useAdminTheme();
  const { profile } = useAuth();
  // Staff accounts are a superadmin-only affair — plain admins neither see
  // the tab nor the route (the API enforces the same rule server-side).
  const isSuper = profile?.role === 'superadmin';
  // Subadmins browse the whole dashboard but change nothing except product
  // photos. RLS enforces it server-side; the UI below only hides/disables.
  const readOnly = profile?.role === 'subadmin';
  const tabs = TABS.filter(
    (t) =>
      (t.to !== '/admin/staff' || isSuper) &&
      (!readOnly || (t.to !== '/admin/customers' && t.to !== '/admin/logs'))
  );
  const [pendingReports, setPendingReports] = useState(0);
  const [reportToast, setReportToast] = useState(false);
  usePageTitle('Admin Dashboard');

  // Live pending-report badge + subtle toast on new submissions.
  // (Requires the table in the supabase_realtime publication; the 60s
  // refetch below keeps the count honest even without it.)
  // Realtime can never throw into React: availability-gated, try/caught,
  // polling-backed. A dead socket degrades to quiet polling, not an Oops page.
  useEffect(() => {
    let live = true;
    let toastTimer: ReturnType<typeof setTimeout> | null = null;
    const refresh = async () => {
      try {
        const { count } = await supabase
          .from('image_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending');
        if (live) setPendingReports(count ?? 0);
      } catch {
        /* polling is best-effort */
      }
    };
    void refresh();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      if (isRealtimeAvailable()) {
        channel = supabase
          .channel('admin-image-requests')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'image_requests' },
            (payload) => {
              void refresh();
              if (payload.eventType === 'INSERT' && live) {
                setReportToast(true);
                if (toastTimer) clearTimeout(toastTimer);
                toastTimer = setTimeout(() => {
                  if (live) setReportToast(false);
                }, 6000);
              }
            }
          )
          .subscribe();
      }
    } catch {
      channel = null;
    }
    const interval = setInterval(refresh, 60_000);
    return () => {
      live = false;
      if (toastTimer) clearTimeout(toastTimer);
      clearInterval(interval);
      if (channel) {
        try {
          supabase.removeChannel(channel).catch(() => undefined);
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  const nav = (
    <nav className="space-y-1" aria-label="Admin sections">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          onClick={() => setDrawer(false)}
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
              isActive ? 'bg-ember text-white shadow-card' : 'text-ink/70 hover:bg-ink/5 hover:text-ink'
            )
          }
        >
          <t.icon size={17} />
          <span className="flex-1">{t.label}</span>
          {t.to === '/admin/image-requests' && pendingReports > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1.5 text-[10px] font-bold text-white">
              {pendingReports > 99 ? '99+' : pendingReports}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className={clsx('bg-paper lg:grid lg:grid-cols-[250px_minmax(0,1fr)]', theme === 'dark' && 'admin-dark')}>
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-ink/10 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:p-5">
        <Link to="/" className="flex items-center gap-2 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink font-display text-sm font-black text-paper">
            D<span className="text-ember">X</span>
          </span>
          <span>
            <span className="block font-display text-base font-black leading-none">DropX Admin</span>
            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-widest text-ink/40">Server-enforced</span>
          </span>
        </Link>
        <div className="mt-6 flex-1">{nav}</div>
        <Link to="/" className="mt-4 block rounded-xl bg-paper px-4 py-2.5 text-center text-xs font-bold text-ink/70 transition hover:bg-paper-dark">
          ← Back to storefront
        </Link>
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-white p-5 shadow-pop">
            <div className="mb-5 flex items-center justify-between">
              <span className="font-display text-base font-black">DropX Admin</span>
              <button onClick={() => setDrawer(false)} aria-label="Close menu" className="rounded-full p-2 hover:bg-ink/5">
                <X size={18} />
              </button>
            </div>
            {nav}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="min-w-0">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink/10 bg-paper/90 px-4 py-3 backdrop-blur lg:px-8">
          <button onClick={() => setDrawer(true)} aria-label="Open admin menu" className="rounded-lg p-2 hover:bg-ink/5 lg:hidden">
            <Menu size={20} />
          </button>
          <p className="text-xs font-semibold text-ink/50">
            RLS-enforced · every write is audited
          </p>
          {readOnly && (
            <p className="rounded-full bg-ember/10 px-3 py-1.5 text-[11px] font-bold text-ember" role="status">
              View only — you can add or remove product photos, nothing else
            </p>
          )}
          <Link
            to="/admin/image-requests"
            aria-label={`Image reports${pendingReports > 0 ? `, ${pendingReports} pending` : ''}`}
            className="relative rounded-full border border-ink/15 bg-white p-2 transition hover:border-ink/40"
          >
            <Bell size={15} />
            {pendingReports > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ember px-1 text-[9px] font-bold text-white">
                {pendingReports > 99 ? '99+' : pendingReports}
              </span>
            )}
          </Link>
          <button
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            className="ml-auto rounded-full border border-ink/15 bg-white p-2 transition hover:border-ink/40"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <Link to="/" className="rounded-full border border-ink/15 bg-white px-4 py-1.5 text-xs font-bold lg:hidden">
            Storefront
          </Link>
        </div>
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="products" element={<Products readOnly={readOnly} />} />
            <Route path="categories" element={<Categories readOnly={readOnly} />} />
            <Route path="orders" element={<Orders readOnly={readOnly} />} />
          <Route path="delivery" element={<AdminDelivery readOnly={readOnly} />} />
            <Route path="customers" element={<Customers />} />
            <Route path="staff" element={<StaffGate />} />
            <Route path="drops" element={<Drops readOnly={readOnly} />} />
          <Route path="reviews" element={<ReviewsMod readOnly={readOnly} />} />
          <Route path="image-requests" element={<AdminImageRequests readOnly={readOnly} />} />
          <Route path="demand" element={<AdminDemand readOnly={readOnly} />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings readOnly={readOnly} />} />
          <Route path="logs" element={<Logs />} />
          </Routes>
        </div>
      </div>
      {reportToast && (
        <div className="fixed bottom-4 right-4 z-50 w-72 rounded-2xl bg-ink p-4 text-paper shadow-pop" role="status">
          <p className="font-display text-sm font-extrabold">New image report</p>
          <p className="mt-0.5 text-xs text-paper/70">A brand just disputed a product photo.</p>
          <div className="mt-2 flex gap-2">
            <Link
              to="/admin/image-requests"
              onClick={() => setReportToast(false)}
              className="rounded-full bg-ember px-4 py-1.5 text-xs font-bold text-white"
            >
              Review
            </Link>
            <button onClick={() => setReportToast(false)} className="rounded-full px-3 py-1.5 text-xs font-bold text-paper/60 hover:text-paper">
              Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Overview ─── */
function Overview() {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    revenue: 0,
    customers: 0,
    unpaid: 0,
    pendingReviews: 0,
    lowStock: [] as { name: string; stock: number }[],
  });
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState<Order[]>([]);

  useEffect(() => {
    (async () => {
      const [p, o, c, v, unpaid, pending] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact' }),
        supabase.from('orders').select('id,grand_total,payment_status').neq('status', 'cancelled'),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'customer'),
        supabase.from('product_variants').select('name,stock').lt('stock', 6).limit(8),
        supabase.from('orders').select('id', { count: 'exact', head: true }).neq('payment_status', 'paid').neq('status', 'cancelled'),
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('is_approved', false),
      ]);
      const list = (o.data ?? []) as { grand_total: number; payment_status: string }[];
      const rev = list.filter((x) => x.payment_status === 'paid').reduce((s, x) => s + Number(x.grand_total), 0);
      setStats({
        products: p.count ?? 0,
        orders: list.length,
        revenue: rev,
        customers: c.count ?? 0,
        unpaid: unpaid.count ?? 0,
        pendingReviews: pending.count ?? 0,
        lowStock: (v.data ?? []) as { name: string; stock: number }[],
      });
      const { data: r } = await supabase.from('orders').select('*').order('placed_at', { ascending: false }).limit(5);
      setRecent((r ?? []) as Order[]);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Skeleton className="h-48" />;
  const cards = [
    { label: 'Products', value: String(stats.products), to: '/admin/products' },
    { label: 'Orders', value: String(stats.orders), to: '/admin/orders' },
    { label: 'Paid revenue', value: formatNPR(stats.revenue), to: '/admin/analytics' },
    { label: 'Customers', value: String(stats.customers), to: '/admin/customers' },
  ];
  return (
    <div>
      <h2 className="font-display text-2xl font-black tracking-tight">Good day — here is the store at a glance</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to}>
            <Card className="p-5 transition hover:-translate-y-0.5 hover:shadow-pop">
              <p className="text-xs font-bold uppercase tracking-widest text-ink/50">{c.label}</p>
              <p className="mt-1 font-display text-2xl font-black">{c.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      {(stats.unpaid > 0 || stats.pendingReviews > 0) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {stats.unpaid > 0 && (
            <Link to="/admin/orders" className="rounded-full bg-ember px-4 py-2 text-xs font-bold text-white">
              {stats.unpaid} order{stats.unpaid === 1 ? '' : 's'} awaiting payment
            </Link>
          )}
          {stats.pendingReviews > 0 && (
            <Link to="/admin/reviews" className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-paper">
              {stats.pendingReviews} review{stats.pendingReviews === 1 ? '' : 's'} to moderate
            </Link>
          )}
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-extrabold">Low stock alerts</h3>
            <Link to="/admin/products" className="text-xs font-bold text-ember hover:underline">Manage inventory</Link>
          </div>
          {stats.lowStock.length === 0 ? (
            <p className="mt-2 text-sm text-ink/60">All variants healthy.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {stats.lowStock.map((v, i) => (
                <li key={i} className="flex justify-between rounded-lg bg-paper px-3 py-2">
                  <span>{v.name}</span>
                  <Badge tone={v.stock === 0 ? 'red' : 'ember'}>{v.stock} left</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-extrabold">Recent orders</h3>
            <Link to="/admin/orders" className="text-xs font-bold text-ember hover:underline">All orders</Link>
          </div>
          <ul className="mt-2 space-y-1.5 text-sm">
            {recent.length === 0 && <li className="text-ink/60">No orders yet.</li>}
            {recent.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2 rounded-lg bg-paper px-3 py-2">
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
const EMPTY_PRODUCT = { name: '', slug: '', brand: '', brand_website: '', description: '', category_id: '', cost_price: '', base_override: '', compare_at_price: '', tags: [] as string[], is_active: true, is_featured: false, is_trending: false, is_new: true };

function Products({ readOnly }: { readOnly: boolean }) {
  const [items, setItems] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [q, setQ] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [vForm, setVForm] = useState({ name: '', sku: '', size: '', color: '', price_adjustment: '0', stock: '10' });
  const [csvMsg, setCsvMsg] = useState<string | null>(null);
  const [csvBusy, setCsvBusy] = useState(false);
  const [margin, setMargin] = useState(20);

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('products').select('*, category:categories(*), images:product_images(*), variants:product_variants(*)').order('created_at', { ascending: false }).limit(200),
      supabase.from('categories').select('*').order('sort_order'),
    ]);
    setItems((p ?? []) as unknown as Product[]);
    setCats((c ?? []) as Category[]);
    setLoading(false);
    fetchSettings().then((s) => setMargin(s.profitMargin)).catch(() => undefined);
  };
  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(
    () => items.filter((p) =>
      (!q || p.name.toLowerCase().includes(q.toLowerCase()) || p.slug.includes(q.toLowerCase())) &&
      (!catFilter || (p.category_id ?? '') === catFilter)
    ),
    [items, q, catFilter]
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
      name: p.name, slug: p.slug, brand: p.brand ?? '', brand_website: p.brand_website ?? '', description: p.description,
      category_id: p.category_id ?? '',
      cost_price: p.cost_price != null ? String(p.cost_price) : '',
      base_override: p.use_custom_price ? String(p.base_price) : '',
      compare_at_price: p.compare_at_price ? String(p.compare_at_price) : '',
      tags: (p.tags ?? []).slice(0, MAX_TAGS_PER_PRODUCT),
      is_active: p.is_active, is_featured: p.is_featured, is_trending: p.is_trending, is_new: p.is_new,
    });
    const { data } = await supabase.from('product_variants').select('*').eq('product_id', p.id).order('created_at');
    setVariants((data ?? []) as ProductVariant[]);
  };

  const save = async () => {
    if (readOnly) return;
    const cost = Number(form.cost_price);
    if (!form.name.trim() || !form.slug.trim() || form.cost_price.trim() === '' || Number.isNaN(cost) || cost < 0) {
      setMsg('Name, slug and a valid cost price (≥ 0) are required.');
      return;
    }
    const customRaw = form.base_override.trim();
    const custom = customRaw === '' ? null : Number(customRaw);
    if (custom !== null && (Number.isNaN(custom) || custom < 0)) {
      setMsg('Custom selling price must be a number ≥ 0 (or blank for automatic).');
      return;
    }
    setSaving(true);
    setMsg(null);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      brand: form.brand.trim().slice(0, 60),
      brand_website: form.brand_website.trim().slice(0, 200) || null,
      description: form.description,
      category_id: form.category_id || null,
      cost_price: cost,
      base_price: custom ?? sellingFromCost(cost, margin),
      use_custom_price: custom !== null,
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      tags: form.tags.slice(0, MAX_TAGS_PER_PRODUCT),
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
    if (readOnly) return;
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

  const download = (filename: string, text: string) => {
    const blob = new Blob([text], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportCSV = () => {
    const catById = new Map(cats.map((c) => [c.id, c.slug]));
    const rows: (string | number | boolean | null)[][] = [[...PRODUCT_CSV_HEADERS]];
    for (const p of filtered) {
      rows.push([
        p.name, p.slug, p.description, catById.get(p.category_id ?? '') ?? '',
        p.base_price, p.compare_at_price, p.is_active, p.is_featured, p.is_trending, p.is_new,
        (p.tags ?? []).join('|'), p.cost_price ?? '', p.brand ?? '',
      ]);
    }
    download('dropx-products.csv', toCSV(rows));
  };

  const importCSV = async (file: File) => {
    setCsvMsg(null);
    setCsvBusy(true);
    try {
      const text = await file.text();
      const { valid, errors } = validateProductRows(parseCSV(text));
      const catBySlug = new Map(cats.map((c) => [c.slug, c.id]));
      const margin = (await fetchSettings()).profitMargin;
      let inserted = 0;
      const problems = [...errors];
      for (const r of valid) {
        if (r.category_slug && !catBySlug.has(r.category_slug)) {
          problems.push(`Line ${r.line} (“${r.name}”): unknown category_slug “${r.category_slug}”.`);
          continue;
        }
        // Cost is the source of truth: selling recomputed with the live margin.
        // An explicit, differing base price is kept as a manual override.
        const cost = r.cost_price ?? costFromSelling(r.base_price, margin);
        const computed = r.cost_price != null ? sellingFromCost(r.cost_price, margin) : r.base_price;
        const custom = r.cost_price != null && r.base_price !== computed;
        const selling = custom ? r.base_price : computed;
        const { error } = await supabase.from('products').insert({
          name: r.name,
          slug: r.slug || `${slugify(r.name)}-${Date.now().toString(36)}`,
          brand: r.brand,
          description: r.description,
          category_id: (r.category_slug && catBySlug.get(r.category_slug)) || null,
          base_price: selling,
          cost_price: cost,
          use_custom_price: custom,
          compare_at_price: r.compare_at_price,
          is_active: r.is_active,
          is_featured: r.is_featured,
          is_trending: r.is_trending,
          is_new: r.is_new,
          tags: r.tags,
        });
        if (error) problems.push(`Line ${r.line} (“${r.name}”): ${error.message}`);
        else inserted++;
      }
      log('product.csv_import', 'products', undefined, { inserted, errors: problems.length });
      setCsvMsg(
        `Imported ${inserted} product${inserted === 1 ? '' : 's'}.` +
          (problems.length > 0 ? ` ${problems.length} issue${problems.length === 1 ? '' : 's'}:\n` + problems.slice(0, 8).join('\n') : '')
      );
      await load();
    } catch (e) {
      setCsvMsg(e instanceof Error ? e.message : 'Import failed.');
    } finally {
      setCsvBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="max-w-xs flex-1 sm:flex-none" aria-label="Search products" />
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs font-bold"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            onClick={() => download('dropx-product-template.csv', toCSV([[...PRODUCT_CSV_HEADERS], ['Sample Hoodie', 'sample-hoodie', 'Heavyweight fleece sample', 'fashion-accessories', 1620, 1999, true, true, true, true, 'apparel|winter|accessories', 1350, 'Sample Brand']]))}
            className="rounded-full bg-white px-4 py-2 text-xs font-bold ring-1 ring-ink/10 transition hover:ring-ink/30"
          >
            Template
          </button>
          <button
            onClick={exportCSV}
            className="rounded-full bg-white px-4 py-2 text-xs font-bold ring-1 ring-ink/10 transition hover:ring-ink/30"
          >
            Export CSV
          </button>
          {!readOnly && (
            <>
              <label className="cursor-pointer rounded-full bg-white px-4 py-2 text-xs font-bold ring-1 ring-ink/10 transition hover:ring-ink/30">
                {csvBusy ? 'Importing…' : 'Import CSV'}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  disabled={csvBusy}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void importCSV(f);
                    e.target.value = '';
                  }}
                />
              </label>
              <Button onClick={() => void startEdit(undefined)}>+ New product</Button>
            </>
          )}
        </div>
      </div>
      {readOnly && (
        <p className="mt-3 rounded-xl bg-ember/10 px-3 py-2 text-xs font-semibold text-ink/70">
          View only — open a product to manage its photos below.
        </p>
      )}
      {csvMsg && (
        <p className="mt-3 whitespace-pre-line rounded-2xl bg-white px-4 py-3 text-xs ring-1 ring-ink/10">{csvMsg}</p>
      )}

      {editing && (
        <Card className="mt-4 p-6">
          <h2 className="font-display text-lg font-extrabold">{editing === 'new' ? 'New product' : 'Edit product'}</h2>
          {readOnly && (
            <p className="mt-2 rounded-xl bg-ember/10 px-3 py-2 text-xs font-semibold text-ink/70">
              View only — everything below is locked except the photo manager.
            </p>
          )}
          <fieldset disabled={readOnly} className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <Input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name,
                    slug: editing === 'new' && (f.slug === '' || f.slug === slugify(f.name)) ? slugify(name) : f.slug,
                  }));
                }}
              />
            </Field>
            <Field label="Slug"><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
            <Field label="Brand (blank = no brand row)">
              <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} maxLength={60} placeholder="e.g. Anker" />
            </Field>
            <Field label="Brand website (optional)">
              <Input value={form.brand_website} onChange={(e) => setForm({ ...form, brand_website: e.target.value })} maxLength={200} placeholder="https://…" inputMode="url" />
            </Field>
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
              <Field label="Cost price — real (NPR)">
                <Input type="number" min={0} value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
              </Field>
              <Field label="Compare-at (optional)">
                <Input type="number" min={0} value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })} />
              </Field>
            </div>
            <p className="rounded-xl bg-ember/10 px-3 py-2 text-xs font-semibold md:col-span-2">
              Sells at {formatNPR(form.base_override.trim() !== '' && !Number.isNaN(Number(form.base_override)) ? Number(form.base_override) : sellingFromCost(Number(form.cost_price) || 0, margin))} —{' '}
              {form.base_override.trim() !== ''
                ? 'your custom price (margin reprices will skip this product).'
                : `real cost + ${margin}% store margin. Saved automatically with the product.`}
            </p>
            <div className="md:col-span-2">
              <Field label="Base (selling) price — optional custom override">
                <Input type="number" min={0} value={form.base_override} onChange={(e) => setForm({ ...form, base_override: e.target.value })} placeholder={`Blank = automatic (${formatNPR(sellingFromCost(Number(form.cost_price) || 0, margin))})`} />
              </Field>
            </div>
            <div className="md:col-span-2">
              <p className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink/60">
                Tags · {form.tags.length}/{MAX_TAGS_PER_PRODUCT} (fixed list — powers filters & recommendations)
              </p>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Product tags">
                {TAG_VOCABULARY.map((t) => {
                  const on = form.tags.includes(t);
                  const full = !on && form.tags.length >= MAX_TAGS_PER_PRODUCT;
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={full}
                      aria-pressed={on}
                      onClick={() =>
                        setForm({
                          ...form,
                          tags: on ? form.tags.filter((x) => x !== t) : [...form.tags, t].slice(0, MAX_TAGS_PER_PRODUCT),
                        })
                      }
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        on ? 'bg-ember text-white' : full ? 'cursor-not-allowed bg-ink/5 text-ink/30' : 'bg-ink/5 text-ink/70 hover:bg-ink/10'
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm md:col-span-2">
              {(['is_active', 'is_featured', 'is_trending', 'is_new'] as const).map((k) => (
                <label key={k} className="flex items-center gap-2 font-medium">
                  <input type="checkbox" checked={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.checked })} className="h-4 w-4 accent-[#F06427]" />
                  {k.replace('is_', '')}
                </label>
              ))}
            </div>
          </fieldset>
          {msg && <p className="mt-3 text-xs text-red-700">{msg}</p>}
          <div className="mt-4 flex gap-2">
            {!readOnly && <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save product'}</Button>}
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
                      {!readOnly && (
                        <>
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
                        </>
                      )}
                    </li>
                  ))}
                  {variants.length === 0 && <li className="text-xs text-ink/50">No variants — add at least one so checkout can verify stock.</li>}
                </ul>
                {!readOnly && (
                  <>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <Input placeholder="Name (M / Black)" value={vForm.name} onChange={(e) => setVForm({ ...vForm, name: e.target.value })} />
                      <Input placeholder="SKU" value={vForm.sku} onChange={(e) => setVForm({ ...vForm, sku: e.target.value })} />
                      <Input placeholder="Size" value={vForm.size} onChange={(e) => setVForm({ ...vForm, size: e.target.value })} />
                      <Input placeholder="Color" value={vForm.color} onChange={(e) => setVForm({ ...vForm, color: e.target.value })} />
                      <Input placeholder="+ NPR adj." type="number" value={vForm.price_adjustment} onChange={(e) => setVForm({ ...vForm, price_adjustment: e.target.value })} />
                      <Input placeholder="Stock" type="number" min={0} value={vForm.stock} onChange={(e) => setVForm({ ...vForm, stock: e.target.value })} />
                    </div>
                    <Button variant="dark" className="mt-2" onClick={addVariant}>Add variant</Button>
                  </>
                )}
              </div>
              <ImageManager productId={editing} allowManage={!readOnly} />
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
                    <span className="flex items-center gap-3">
                      <img src={primaryImage(p, 100)} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-lg bg-paper-dark object-cover ring-1 ring-ink/10" />
                      <span className="min-w-0">
                        <p className="truncate font-bold">{p.name}</p>
                        <p className="truncate text-xs text-ink/50">{p.slug} · {p.category?.name ?? '—'}</p>
                        <p className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] font-semibold">
                          <span className={(p.images?.length ?? 0) > 0 ? 'text-green-700' : 'text-red-600'}>
                            {p.images?.length ?? 0} imgs
                          </span>
                          <span className={(p.variants?.length ?? 0) > 0 ? 'text-green-700' : 'text-red-600'}>
                            {p.variants?.length ?? 0} variants
                          </span>
                          <span className={(p.tags?.length ?? 0) > 0 ? 'text-ink/50' : 'text-red-600'}>
                            {p.tags?.length ?? 0}/3 tags
                          </span>
                        </p>
                        {(p.tags?.length ?? 0) > 0 && (
                          <p className="mt-0.5 truncate text-[11px] font-semibold text-ember">
                            {p.tags!.map((t) => `#${t}`).join(' ')}
                          </p>
                        )}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatNPR(p.base_price)}</td>
                  <td className="px-4 py-3"><Badge tone={stock === 0 ? 'red' : stock < 10 ? 'ember' : 'green'}>{stock}</Badge></td>
                  <td className="px-4 py-3">
                    <span className="flex gap-1">
                      {!p.is_active && <Badge tone="red">hidden</Badge>}
                      {p.use_custom_price && <Badge tone="paper">custom</Badge>}
                      {p.is_trending && <Badge>hot</Badge>}
                      {p.is_new && <Badge tone="ink">new</Badge>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex flex-wrap justify-end gap-1.5">
                      <a href={`/product/${p.slug}`} target="_blank" rel="noreferrer" className="rounded-full bg-ink/5 px-3 py-1.5 text-xs font-bold hover:bg-ink/10">View</a>
                      <button onClick={() => void startEdit(p)} className="rounded-full bg-ink/5 px-3 py-1.5 text-xs font-bold hover:bg-ink/10">{readOnly ? 'Photos' : 'Edit'}</button>{' '}
                      {!readOnly && <button onClick={() => setConfirmDel(p)} className="rounded-full bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700">Delete</button>}
                    </span>
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
function Categories({ readOnly }: { readOnly: boolean }) {
  const [items, setItems] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: '', slug: '', description: '', image_url: '' });
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
      {!readOnly && (
        <Card className="h-fit p-5">
          <h2 className="font-display font-extrabold">New category</h2>
        <div className="mt-3 space-y-3">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Slug"><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from name" /></Field>
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm" />
          </Field>
          <CloudinaryUpload label="Tile image" value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
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
              if (form.image_url.trim() !== '' && !form.image_url.trim().startsWith('https://')) {
                setMsg('Tile image must be an https:// URL (or uploaded above).');
                return;
              }
              supabase.from('categories').insert({ name, slug, description: form.description, image_url: form.image_url || null, sort_order: items.length })
                .then(({ error }) => {
                  if (error) setMsg(error.message);
                  else {
                    log('category.create', 'categories', undefined, { name });
                    setForm({ name: '', slug: '', description: '', image_url: '' });
                    void load();
                  }
                });
            }}
          >
            Create category
          </Button>
        </div>
      </Card>
      )}
      <Card className="p-5">
        <h2 className="font-display font-extrabold">Categories ({items.length})</h2>
        <ul className="mt-3 space-y-2">
          {items.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-xl bg-paper px-4 py-3 text-sm">
              {c.image_url ? (
                <img src={c.image_url} alt="" loading="lazy" className="h-10 w-14 rounded-lg object-cover ring-1 ring-ink/10" />
              ) : (
                <span className="flex h-10 w-14 items-center justify-center rounded-lg bg-ink/10 font-display text-xs font-black text-ink/40">DX</span>
              )}
              <span className="min-w-0 flex-1"><strong>{c.name}</strong> <span className="text-ink/50">· /{c.slug}</span></span>
              <a href={`/shop?category=${c.slug}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-ember hover:underline">
                View
              </a>
              {!readOnly && (
                <>
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
                </>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ─── Orders ─── */
function Orders({ readOnly }: { readOnly: boolean }) {
  const [items, setItems] = useState<Order[]>([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [orderErr, setOrderErr] = useState<string | null>(null);
  const nav = useNavigate();

  const load = async () => {
    setLoading(true);
    setOrderErr(null);
    let q = supabase.from('orders').select('*, items:order_items(*)').order('placed_at', { ascending: false }).limit(100);
    if (filter && filter !== 'unpaid') q = q.eq('status', filter);
    if (filter === 'unpaid') q = q.eq('payment_status', 'unpaid').neq('status', 'cancelled');
    const { data, error } = await q;
    if (error) setOrderErr(error.message);
    setItems((data ?? []) as unknown as Order[]);
    setLoading(false);
  };
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const setStatus = async (o: Order, status: Order['status']) => {
    if (readOnly) return;
    const { error } = await supabase.rpc('admin_set_order_status', { p_order: o.id, p_status: status });
    if (!error) {
      setOrderErr(null);
      setItems(items.map((x) => (x.id === o.id ? { ...x, status } : x)));
      log('order.status', 'orders', o.id, { status });
    } else {
      setOrderErr(`Could not move ${o.order_number} to ${status}: ${error.message}`);
    }
  };

  const markPaid = async (o: Order) => {
    if (readOnly) return;
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

  const [bulkReason, setBulkReason] = useState<string>(ADMIN_CANCEL_REASONS[0]);
  const [bulkCustom, setBulkCustom] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);

  const cancelAllPending = async () => {
    if (readOnly) return;
    const reason = buildCancelReason(bulkReason, bulkCustom);
    if (!reason) {
      setBulkMsg('Pick a reason first — every cancelled customer sees it.');
      return;
    }
    if (!confirm(`Cancel EVERY pending + confirmed order with reason:\n\n“${reason}”\n\nStock returns to shelves. This cannot be undone.`)) return;
    setBulkBusy(true);
    setBulkMsg(null);
    const { data, error } = await supabase.rpc('admin_cancel_all', { p_reason: reason });
    setBulkBusy(false);
    if (error) setBulkMsg(error.message);
    else {
      setBulkMsg(`Cancelled ${Number(data ?? 0)} orders.`);
      void load();
    }
  };

  const purgeOld = async () => {
    if (readOnly) return;
    if (!confirm('Permanently delete cancelled + delivered orders older than 7 days?\n\nOrder items go with them; reviews stay. This cannot be undone.')) return;
    setBulkBusy(true);
    setBulkMsg(null);
    const { data, error } = await supabase.rpc('purge_old_orders');
    setBulkBusy(false);
    if (error) setBulkMsg(error.message);
    else {
      setBulkMsg(`Deleted ${Number(data ?? 0)} orders older than 7 days.`);
      void load();
    }
  };

  if (loading) return <Skeleton className="h-64" />;
  const shown = items.filter((o) => {
    const s = search.trim().toLowerCase();
    if (!s) return true;
    return (
      o.order_number.toLowerCase().includes(s) ||
      o.shipping_name.toLowerCase().includes(s) ||
      o.shipping_phone.replace(/\s+/g, '').includes(s.replace(/\s+/g, ''))
    );
  });
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order №, name, phone…" className="max-w-xs flex-1 sm:flex-none" aria-label="Search orders" />
      </div>
      {orderErr && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 ring-1 ring-red-200" role="alert">{orderErr}</p>}
      {readOnly ? (
        <p className="mt-3 rounded-xl bg-ember/10 px-3 py-2 text-xs font-semibold text-ink/70">
          View only — order statuses, payments and cancellations are handled by admins.
        </p>
      ) : (
      <details className="mt-3 rounded-2xl border border-ink/10 bg-white p-4">
        <summary className="cursor-pointer text-sm font-bold">Bulk actions — cancel all pending, 7-day cleanup</summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink/60" htmlFor="bulk-cancel-reason">
              Reason shown to every cancelled customer
            </label>
            <select
              id="bulk-cancel-reason"
              value={bulkReason}
              onChange={(e) => setBulkReason(e.target.value)}
              className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm"
            >
              {ADMIN_CANCEL_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {bulkReason === 'Other' && (
              <input
                value={bulkCustom}
                onChange={(e) => setBulkCustom(e.target.value)}
                placeholder="Write the reason…"
                maxLength={500}
                className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm"
                aria-label="Custom bulk cancellation reason"
              />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void cancelAllPending()} disabled={bulkBusy} className="rounded-full bg-red-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50">
              {bulkBusy ? 'Working…' : 'Cancel all pending'}
            </button>
            <button onClick={() => void purgeOld()} disabled={bulkBusy} className="rounded-full border border-ink/15 bg-white px-4 py-2.5 text-xs font-bold transition hover:border-ink/40 disabled:opacity-50">
              {bulkBusy ? 'Working…' : 'Delete 7-day-old done orders'}
            </button>
          </div>
        </div>
        {bulkMsg && <p className="mt-2 text-xs font-semibold text-ink/70" role="status">{bulkMsg}</p>}
      </details>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'unpaid'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${filter === s ? 'bg-ink text-paper' : 'bg-white ring-1 ring-ink/10'}`}
          >
            {s === '' ? 'All' : s === 'unpaid' ? 'Unpaid' : s}
          </button>
        ))}
        <button onClick={() => void load()} className="ml-auto rounded-full bg-white px-3.5 py-1.5 text-xs font-bold ring-1 ring-ink/10">Refresh</button>
      </div>
      <div className="mt-4 space-y-3">
        {shown.map((o) => (
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
            {o.status === 'cancelled' && o.cancel_reason && (
              <p className="mt-1 rounded-lg bg-paper px-2.5 py-1.5 text-xs text-ink/60">
                Cancelled{ o.cancelled_by === 'customer' ? ' by customer' : ' by store'} — “{o.cancel_reason}”.
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {o.status === 'cancelled' ? (
                <span className="rounded-full bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700">cancelled</span>
              ) : (
                <select
                  value={o.status}
                  disabled={readOnly}
                  onChange={(e) => void setStatus(o, e.target.value as Order['status'])}
                  className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs font-bold disabled:opacity-60"
                  aria-label="Order status"
                >
                  {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'refunded'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
              {!readOnly && o.payment_status !== 'paid' && (
                <button onClick={() => void markPaid(o)} className="rounded-full bg-ember px-3.5 py-1.5 text-xs font-bold text-white">
                  Mark paid (verified ref required)
                </button>
              )}
            </div>
            {!readOnly && !['delivered', 'cancelled', 'refunded'].includes(o.status) && (
              <div className="mt-2">
                <CancelOrderBox
                  presets={ADMIN_CANCEL_REASONS}
                  title="Cancel order"
                  body="The customer sees the reason. Stock returns to shelves."
                  onConfirm={async (reason) => {
                    const { error } = await supabase.rpc('cancel_order', { p_order: o.id, p_reason: reason });
                    if (error) throw new Error(error.message);
                    setItems(items.map((x) => (x.id === o.id ? { ...x, status: 'cancelled', cancel_reason: reason, cancelled_by: 'admin' } as Order : x)));
                    log('order.cancel', 'orders', o.id, { reason });
                  }}
                />
              </div>
            )}
          </Card>
        ))}
        {shown.length === 0 && <EmptyState title="No orders" body={search ? 'No orders match your search.' : 'Orders will appear here as customers check out.'} />}
      </div>
    </div>
  );
}

/* ─── Customers ─── */
/* ─── Staff (subadmin accounts: username + password, images only) ─── */
function StaffGate() {
  const { profile } = useAuth();
  if (profile?.role !== 'superadmin') {
    return (
      <EmptyState
        title="Superadmins only"
        body="Staff accounts can only be created and managed by a superadmin."
      />
    );
  }
  return <Staff />;
}

function Staff() {
  const [items, setItems] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPw, setResetPw] = useState('');
  const [share, setShare] = useState<{ code: string; forUser: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').eq('role', 'subadmin').order('created_at', { ascending: false });
    setItems((data ?? []) as Profile[]);
    setLoading(false);
  };
  useEffect(() => {
    void load();
  }, []);

  const callApi = async (body: object) => {
    const { data: session } = await supabase.auth.getSession();
    const res = await fetch('/api/staff-manage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session.session ? { Authorization: `Bearer ${session.session.access_token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const out = (await res.json().catch(() => ({}))) as {
      ok?: boolean; error?: string; share_code?: string | null; share_unavailable?: string;
    };
    if (!res.ok || !out.ok) throw new Error(out.error ?? 'Request failed.');
    return out;
  };

  const copyShare = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const say = (good: boolean, text: string) => {
    setOk(good);
    setMsg(text);
  };

  if (loading) return <Skeleton className="h-64" />;
  return (
    <div>
      <Card className="p-5">
        <h3 className="font-display text-base font-extrabold">New staff account</h3>
        <p className="mt-1 text-xs text-ink/60">
          Username + password only — no email. Staff sign in at <span className="font-bold">/staff/login</span> and can
          only add or remove product images. Nothing else.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label="Username">
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. photo-team" maxLength={24} autoComplete="off" />
          </Field>
          <Field label="Password (min 8)">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="Display name (optional)">
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Rojina" maxLength={120} />
          </Field>
        </div>
        {msg && (
          <p className={`mt-3 rounded-xl px-3 py-2 text-xs font-semibold ring-1 ${ok ? 'bg-green-50 text-green-800 ring-green-200' : 'bg-red-50 text-red-700 ring-red-200'}`} role={ok ? 'status' : 'alert'}>
            {msg}
          </p>
        )}
        {share && (
          <div className="mt-3 rounded-2xl border border-ember/40 bg-ember/5 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-ember">One-time login code for @{share.forUser}</p>
            <p className="mt-2 break-all rounded-xl bg-ink px-3 py-2.5 font-mono text-sm text-paper">{share.code}</p>
            <p className="mt-2 text-xs text-ink/60">
              Safe to send over chat — it reveals the password <strong>once</strong>, then dies (7-day expiry).
              Need another? Reset the password to mint a fresh code.
            </p>
            <div className="mt-2 flex gap-2">
              <Button variant="dark" className="!px-4 !py-2 text-xs" onClick={() => void copyShare(share.code)}>
                {copied ? 'Copied!' : 'Copy code'}
              </Button>
              <Button variant="ghost" className="!px-4 !py-2 text-xs" onClick={() => setShare(null)}>Dismiss</Button>
            </div>
          </div>
        )}
        <Button
          className="mt-3"
          disabled={busy}
          onClick={() => {
            const uErr = validateStaffUsername(username);
            if (uErr) {
              say(false, uErr);
              return;
            }
            const pErr = validateStaffPassword(password);
            if (pErr) {
              say(false, pErr);
              return;
            }
            setBusy(true);
            setMsg(null);
            setShare(null);
            callApi({ action: 'create', username: username.trim(), password, full_name: fullName.trim() }).then(
              (out) => {
                const uname = username.trim().toLowerCase();
                if (out.share_code) {
                  setShare({ code: out.share_code, forUser: uname });
                  say(true, `Staff account “${uname}” created — send the one-time code below, not the password.`);
                } else {
                  say(true, `Staff account “${uname}” created — share the username + password with them directly.`);
                }
                setUsername('');
                setPassword('');
                setFullName('');
                setBusy(false);
                void load();
              },
              (e: unknown) => {
                say(false, e instanceof Error ? e.message : 'Could not create staff account.');
                setBusy(false);
              }
            );
          }}
        >
          {busy ? 'Creating…' : 'Create staff account'}
        </Button>
      </Card>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-card ring-1 ring-ink/5">
        <table className="w-full min-w-[42rem] text-left text-sm">
          <thead><tr className="border-b border-ink/10 text-xs uppercase tracking-wider text-ink/50">
            <th className="px-4 py-3">Staff</th><th className="px-4 py-3">Since</th><th className="px-4 py-3 text-right">Action</th>
          </tr></thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-ink/50">No staff accounts yet.</td></tr>
            )}
            {items.map((p) => (
              <tr key={p.id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-bold">@{p.username ?? '—'}</p>
                  <p className="text-xs text-ink/50">{p.full_name || 'No display name'}</p>
                </td>
                <td className="px-4 py-3 text-xs text-ink/50">
                  {(p as { created_at?: string }).created_at
                    ? new Date((p as { created_at?: string }).created_at as string).toLocaleDateString('en-NP')
                    : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  {resetId === p.id ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Input
                        type="password"
                        value={resetPw}
                        onChange={(e) => setResetPw(e.target.value)}
                        placeholder="New password"
                        className="!w-40 !py-1.5 text-xs"
                        aria-label="New password"
                      />
                      <button
                        onClick={() => {
                          const pErr = validateStaffPassword(resetPw);
                          if (pErr) {
                            say(false, pErr);
                            return;
                          }
                          callApi({ action: 'reset', user_id: p.id, password: resetPw }).then(
                            (out) => {
                              if (out.share_code) {
                                setShare({ code: out.share_code, forUser: p.username ?? 'staff' });
                                say(true, `Password reset for @${p.username ?? 'staff'} — send the one-time code below.`);
                              } else {
                                say(true, `Password reset for @${p.username ?? 'staff'}.`);
                              }
                              setResetId(null);
                              setResetPw('');
                            },
                            (e: unknown) => say(false, e instanceof Error ? e.message : 'Reset failed.')
                          );
                        }}
                        className="rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-paper"
                      >
                        Save
                      </button>
                      <button onClick={() => { setResetId(null); setResetPw(''); }} className="rounded-full px-3 py-1.5 text-xs font-bold text-ink/60 hover:bg-ink/5">
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <button onClick={() => { setResetId(p.id); setResetPw(''); setMsg(null); }} className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-bold hover:border-ink/40">
                        Reset password
                      </button>
                      <button
                        onClick={() => {
                          if (!confirm(`Remove staff account @${p.username ?? 'staff'}? They will be signed out everywhere and cannot sign back in.`)) return;
                          callApi({ action: 'delete', user_id: p.id }).then(
                            () => {
                              say(true, 'Staff account removed.');
                              void load();
                            },
                            (e: unknown) => say(false, e instanceof Error ? e.message : 'Remove failed.')
                          );
                        }}
                        className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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

function Drops({ readOnly }: { readOnly: boolean }) {
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
    if (readOnly) return;
    if (!form.title.trim() || !form.slug.trim()) {
      setMsg('Title and slug are required.');
      return;
    }
    if (form.artwork_url.trim() !== '' && !form.artwork_url.trim().startsWith('https://')) {
      setMsg('Artwork must be an https:// URL (or uploaded via Cloudinary above).');
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
        {!readOnly && <Button onClick={() => void startEdit(undefined)} className="ml-auto">+ New drop</Button>}
      </div>

      {editing && (
        <Card className="mt-4 p-6">
          <h2 className="font-display text-lg font-extrabold">{editing === 'new' ? 'New drop' : 'Edit drop'}</h2>
          <fieldset disabled={readOnly} className="mt-4 grid gap-4 md:grid-cols-2">
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
            <Field label="Artwork URL (Cloudinary)"> 
              <div className="space-y-2">
                <CloudinaryUpload label="Drop artwork" value={form.artwork_url} onChange={(url) => setForm({ ...form, artwork_url: url })} />
                <Input value={form.artwork_url} onChange={(e) => setForm({ ...form, artwork_url: e.target.value })} placeholder="…or paste an image URL" />
              </div>
            </Field>
            <Field label="Hero label"><Input value={form.hero_label} onChange={(e) => setForm({ ...form, hero_label: e.target.value })} placeholder="DROP OF THE MONTH" /></Field>
            <Field label="Accent color">
              <span className="flex items-center gap-2">
                <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(form.theme_color) ? form.theme_color : '#F06427'} onChange={(e) => setForm({ ...form, theme_color: e.target.value })} className="h-10 w-12 cursor-pointer rounded-lg border border-ink/15 bg-white p-1" aria-label="Drop accent color" />
                <span className="text-xs font-bold" style={{ color: form.theme_color || '#F06427' }}>Live preview</span>
              </span>
            </Field>
            <Field label="Starts at"><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></Field>
            <Field label="Ends at"><Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></Field>
          </fieldset>

          <div className="mt-4">
            <h3 className="font-bold">Curated products</h3>
            <ul className="mt-2 space-y-1.5">
              {links.map((l, i) => (
                <li key={l.product_id} className="flex items-center gap-2 rounded-xl bg-paper px-3 py-2 text-sm">
                  <span className="flex-1 font-semibold">{products.find((p) => p.id === l.product_id)?.name ?? l.product_id}</span>
                  <input value={l.badge} disabled={readOnly} onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, badge: e.target.value } : x)))} placeholder="Badge" className="w-28 rounded-lg border border-ink/15 px-2 py-1 text-xs disabled:opacity-60" />
                  {!readOnly && <button onClick={() => setLinks(links.filter((_, j) => j !== i))} className="text-xs font-bold text-red-600">Remove</button>}
                </li>
              ))}
            </ul>
            {!readOnly && (
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
            )}
          </div>

          {msg && <p className="mt-3 text-xs text-red-700">{msg}</p>}
          <div className="mt-4 flex gap-2">
            {!readOnly && <Button onClick={save}>Save drop</Button>}
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
              <a href={`/drops/${d.slug}`} target="_blank" rel="noreferrer" className="rounded-full bg-ink/5 px-3.5 py-1.5 text-xs font-bold">View</a>
              <button onClick={() => void startEdit(d)} className="rounded-full bg-ink/5 px-3.5 py-1.5 text-xs font-bold">Edit</button>
              {!readOnly && (
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
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── Reviews moderation ─── */
function ReviewsMod({ readOnly }: { readOnly: boolean }) {
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
            {!readOnly && (
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
            )}
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

/* ─── Store settings (the whole shop, customizable without code) ─── */
function Settings({ readOnly }: { readOnly: boolean }) {
  const [form, setForm] = useState({
    announcement: '',
    support_email: '',
    free_shipping_threshold: '',
    profit_margin: '',
    delivery_rate_standard: '',
    delivery_rate_express: '',
    maintenance_enabled: '',
    maintenance_frequency: '',
    maintenance_countdown: '',
    maintenance_title: '',
    maintenance_message: '',
    maintenance_button: '',
    maintenance_particles: '',
    maintenance_contact: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [includeCustom, setIncludeCustom] = useState(false);

  useEffect(() => {
    supabase.from('store_settings').select('key,value').then(({ data }) => {
      const get = (k: string) => (data ?? []).find((r: { key: string }) => r.key === k)?.value ?? '';
      setForm({
        announcement: get('announcement'),
        support_email: get('support_email'),
        free_shipping_threshold: get('free_shipping_threshold'),
        profit_margin: get('profit_margin'),
        delivery_rate_standard: get('delivery_rate_standard'),
        delivery_rate_express: get('delivery_rate_express'),
        maintenance_enabled: get('maintenance_enabled'),
        maintenance_frequency: get('maintenance_frequency'),
        maintenance_countdown: get('maintenance_countdown'),
        maintenance_title: get('maintenance_title'),
        maintenance_message: get('maintenance_message'),
        maintenance_button: get('maintenance_button'),
        maintenance_particles: get('maintenance_particles') || '1',
        maintenance_contact: get('maintenance_contact') || '1',
      });
      setLoading(false);
    });
  }, []);

  const marginNum = () => {
    const n = Number(form.profit_margin);
    return form.profit_margin.trim() === '' || Number.isNaN(n) ? 20 : Math.min(100, Math.max(0, n));
  };

  const save = async () => {
    if (readOnly) return;
    setMsg(null);
    const nums: Record<string, string> = {
      free_shipping_threshold: form.free_shipping_threshold,
      delivery_rate_standard: form.delivery_rate_standard,
      delivery_rate_express: form.delivery_rate_express,
    };
    for (const [k, v] of Object.entries(nums)) {
      if (v.trim() !== '' && (Number.isNaN(Number(v)) || Number(v) < 0)) {
        setMsg(`“${k}” must be a number ≥ 0.`);
        return;
      }
    }
    if (form.profit_margin.trim() !== '') {
      const m = Number(form.profit_margin);
      if (Number.isNaN(m) || m < 0 || m > 100) {
        setMsg('Profit margin must be between 0 and 100.');
        return;
      }
    }
    if (form.maintenance_countdown.trim() !== '') {
      const c = Number(form.maintenance_countdown);
      if (Number.isNaN(c) || c < 0 || c > 60) {
        setMsg('Countdown must be 0–60 seconds (0 = button active immediately).');
        return;
      }
    }
    if (form.maintenance_frequency.trim() !== '' && !['always', 'once'].includes(form.maintenance_frequency.trim())) {
      setMsg('Frequency must be “always” or “once”.');
      return;
    }
    if (!form.support_email.includes('@')) {
      setMsg('Support email looks invalid.');
      return;
    }
    setSaving(true);
    const BOOLEANS = ['maintenance_enabled', 'maintenance_particles', 'maintenance_contact'];
    const entries = Object.entries(form)
      .filter(([k, v]) => !BOOLEANS.includes(k) && v.trim() !== '')
      .map(([key, value]) => ({ key, value: value.trim() }));
    // Toggles always persist explicitly ('1'/'0') so unchecking sticks.
    for (const k of BOOLEANS) {
      entries.push({ key: k, value: form[k as keyof typeof form].trim() === '1' ? '1' : '0' });
    }
    const { error } = await supabase
      .from('store_settings')
      .upsert(entries, { onConflict: 'key' });
    if (error) setMsg(error.message);
    else {
      log('settings.update', 'store_settings', undefined, Object.fromEntries(entries.map((e) => [e.key, e.value])));
      setMsg('Settings saved — the storefront and checkout pricing update immediately.');
    }
    setSaving(false);
  };

  if (loading) return <Skeleton className="h-64" />;

  const applyMargin = async () => {
    if (readOnly) return;
    const m = marginNum();
    const scope = includeCustom
      ? 'EVERY product (hand-priced items lose their custom flag)'
      : 'every cost-priced product (hand-priced items are skipped)';
    if (!confirm(`Reprice ${scope} to cost + ${m}%?\n\nThe margin is saved as the store default too. This cannot be undone — but every change is logged.`)) return;
    setApplying(true);
    setMsg(null);
    // The margin only "works" as the saved default — product forms price
    // automatically from it — so persist it before touching products.
    const { error: marginErr } = await supabase
      .from('store_settings')
      .upsert({ key: 'profit_margin', value: String(m) }, { onConflict: 'key' });
    if (marginErr) {
      setMsg(marginErr.message);
      setApplying(false);
      return;
    }
    setForm((f) => ({ ...f, profit_margin: String(m) }));
    // supabase-js can't express computed updates, so this is two honest
    // steps: 1) read every cost, 2) write each computed selling price.
    const { data: rows, error: readErr } = await supabase
      .from('products')
      .select('id,cost_price,use_custom_price');
    if (readErr) {
      setMsg(readErr.message);
      setApplying(false);
      return;
    }
    const list = (rows ?? []) as { id: string; cost_price: number | null; use_custom_price: boolean }[];
    const priced = list.filter((r) => !r.use_custom_price);
    const targets = (includeCustom ? list : priced).filter(
      (r) => r.cost_price !== null && !Number.isNaN(Number(r.cost_price))
    );
    const skipped = list.length - targets.length;
    let updated = 0;
    const problems: string[] = [];
    for (let i = 0; i < targets.length; i += 25) {
      const chunk = targets.slice(i, i + 25);
      const results = await Promise.all(
        chunk.map((r) =>
          supabase
            .from('products')
            .update({
              base_price: sellingFromCost(Number(r.cost_price), m),
              ...(includeCustom ? { use_custom_price: false } : {}),
            })
            .eq('id', r.id)
        )
      );
      for (const res of results) {
        if (res.error) problems.push(res.error.message);
        else updated++;
      }
    }
    log('products.reprice', 'products', undefined, { margin: m, updated, skipped, includeCustom });
    setMsg(
      (problems.length > 0
        ? `Repriced ${updated} products at +${m}%. ${problems.length} failed: ${problems[0]}`
        : `Repriced ${updated} products at +${m}% over real cost. Storefront prices update immediately.`) +
        (skipped > 0
          ? ` ${skipped} item${skipped === 1 ? '' : 's'} skipped (hand-priced or missing cost${includeCustom ? '' : ' — tick the box to include hand-priced ones'}).`
          : '')
    );
    setApplying(false);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <Card className="h-fit p-6">
        <h2 className="font-display text-lg font-extrabold">Store settings</h2>
        <p className="mt-1 text-xs text-ink/60">
          Announcement bar, support contact and shipping rules. Checkout totals are enforced
          server-side from these same rows — no code changes needed.
        </p>
        <div className="mt-4 space-y-4">
          {readOnly && (
            <p className="rounded-xl bg-ember/10 px-3 py-2 text-xs font-semibold text-ink/70">
              View only — settings are managed by admins.
            </p>
          )}
          <fieldset disabled={readOnly} className="space-y-4">          <Field label="Announcement bar text">
            <Input value={form.announcement} onChange={(e) => setForm({ ...form, announcement: e.target.value })} placeholder="Free standard shipping over NPR 2,999" />
          </Field>
          <Field label="Support email">
            <Input type="email" value={form.support_email} onChange={(e) => setForm({ ...form, support_email: e.target.value })} placeholder="dropx.nepal@gmail.com" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Free shipping over (NPR)">
              <Input type="number" min={0} value={form.free_shipping_threshold} onChange={(e) => setForm({ ...form, free_shipping_threshold: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <p className="rounded-xl bg-paper px-3 py-2.5 text-xs text-ink/60">
                Per-order fees now come from <strong>Admin → Delivery</strong> plans (base + Rs/km).
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-paper p-4">
            <h3 className="font-display font-extrabold">Distance rates from Imadol (Rs/km)</h3>
            <p className="mt-1 text-xs text-ink/60">
              Checkout multiplies these by each area's road distance — e.g. Thamel (~8 km):
              standard Rs {8 * (Number(form.delivery_rate_standard) || 10)} ·
              express Rs {8 * (Number(form.delivery_rate_express) || 20)}.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <Field label="Standard Rs/km">
                <Input type="number" min={0} value={form.delivery_rate_standard} onChange={(e) => setForm({ ...form, delivery_rate_standard: e.target.value })} placeholder="10" />
              </Field>
              <Field label="Express Rs/km">
                <Input type="number" min={0} value={form.delivery_rate_express} onChange={(e) => setForm({ ...form, delivery_rate_express: e.target.value })} placeholder="20" />
              </Field>
            </div>
          </div>
          {msg && <p className="whitespace-pre-line rounded-xl bg-paper px-3 py-2 text-xs">{msg}</p>}
          {!readOnly && (
            <div className="flex flex-wrap gap-2">
              <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</Button>
            </div>
          )}

          <div className="rounded-2xl border border-ember/30 bg-ember/5 p-4">
            <h3 className="font-display font-extrabold">Profit margin — {marginNum()}% over real cost</h3>
            <p className="mt-1 text-xs text-ink/60">
              Every product carries its real cost price. Applying saves this margin as the store
              default and reprices from cost — e.g. Rs 1,000 cost → Rs {sellingFromCost(1000, marginNum())} selling.
              Hand-priced items are skipped unless you tick the box.
            </p>
            <div className="mt-3 grid max-w-xs grid-cols-1 gap-2">
              <Field label="Margin % (0–100, default 20)">
                <Input type="number" min={0} max={100} value={form.profit_margin} onChange={(e) => setForm({ ...form, profit_margin: e.target.value })} placeholder="20" />
              </Field>
            </div>
            <label className="mt-2 flex cursor-pointer items-start gap-2 text-xs text-ink/70">
              <input type="checkbox" checked={includeCustom} onChange={(e) => setIncludeCustom(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#F06427]" />
              <span>Also rewrite <strong className="text-ink">hand-priced</strong> items (they lose their custom flag).</span>
            </label>
            {!readOnly && (
              <Button onClick={applyMargin} disabled={applying || saving} variant="dark" className="mt-3">
                {applying ? 'Repricing…' : `Apply +${marginNum()}% to all products`}
              </Button>
            )}
          </div>

          <div className="rounded-2xl border border-ink/10 bg-paper p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display font-extrabold">Maintenance page</h3>
              <button
                onClick={() => setForm({ ...form, maintenance_enabled: form.maintenance_enabled === '1' ? '0' : '1' })}
                aria-pressed={form.maintenance_enabled === '1'}
                aria-label="Toggle maintenance mode"
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${form.maintenance_enabled === '1' ? 'bg-ember' : 'bg-ink/15'}`}
              >
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${form.maintenance_enabled === '1' ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
            <p className="mt-1 text-xs text-ink/60">
              Brand and theme stay fixed — everything below is editable. Takes effect on save (no code changes).
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Show to visitors">
                <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Maintenance frequency">
                  {(['once', 'always'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      role="radio"
                      aria-checked={(form.maintenance_frequency || 'once') === f}
                      onClick={() => setForm({ ...form, maintenance_frequency: f })}
                      title={f === 'once' ? 'Remember Continue for the browser session' : 'Block again on every fresh page load'}
                      className={`rounded-xl border px-3 py-2 text-xs font-bold capitalize transition ${
                        (form.maintenance_frequency || 'once') === f ? 'border-ink bg-ink text-paper' : 'border-ink/15 bg-white hover:border-ink/40'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Button timer (seconds, 0–60)">
                <Input type="number" min={0} max={60} value={form.maintenance_countdown} onChange={(e) => setForm({ ...form, maintenance_countdown: e.target.value })} placeholder="6" />
              </Field>
            </div>
            <div className="mt-3 space-y-3">
              <Field label="Headline (blank = default)">
                <Input value={form.maintenance_title} onChange={(e) => setForm({ ...form, maintenance_title: e.target.value })} placeholder="We're tuning the Drop." />
              </Field>
              <Field label="Message (blank = default)">
                <textarea value={form.maintenance_message} onChange={(e) => setForm({ ...form, maintenance_message: e.target.value })} rows={2} placeholder="DropX is getting a quick tune-up…" className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm" />
              </Field>
              <Field label="Button label (blank = Continue Anyway)">
                <Input value={form.maintenance_button} onChange={(e) => setForm({ ...form, maintenance_button: e.target.value })} placeholder="Continue Anyway" />
              </Field>
              <div className="flex flex-wrap gap-4 text-sm">
                {([
                  ['maintenance_particles', 'Animated particles'],
                  ['maintenance_contact', 'Support email line'],
                ] as const).map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2 font-medium">
                    <input
                      type="checkbox"
                      checked={form[k] === '' ? true : form[k] === '1'}
                      onChange={(e) => setForm({ ...form, [k]: e.target.checked ? '1' : '0' })}
                      className="h-4 w-4 accent-[#F06427]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          </fieldset>
        </div>
      </Card>
      <Card className="h-fit p-6">
        <h3 className="font-display font-extrabold">How it works</h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-ink/60">
          <li>The announcement bar and footer email update across the whole site.</li>
          <li>Shipping fees apply to new orders instantly — the database function reads these rows at checkout.</li>
          <li>Completed orders keep their original totals as snapshots; changing fees never rewrites history.</li>
          <li>Every save is recorded in the activity log.</li>
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
