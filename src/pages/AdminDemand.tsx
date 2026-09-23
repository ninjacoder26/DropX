import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { logAdminAction as log } from '../lib/admin';
import { fetchPopularity, type PopularityRow } from '../lib/recommend';
import type { Category, Product, ProductRequest } from '../types';
import { formatNPR } from '../lib/shop';
import { Badge, Button, Card, ConfirmDialog, EmptyState, Skeleton } from '../components/ui';

type SortKey = 'score' | 'views' | 'purchases' | 'conversion';

const WINDOW_30 = new Date(Date.now() - 30 * 864e5).toISOString();
const WINDOW_7 = new Date(Date.now() - 7 * 864e5).toISOString();

export default function AdminDemand({ readOnly }: { readOnly: boolean }) {
  const [searches, setSearches] = useState<{ query: string; meta: { results?: number } }[]>([]);
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [catEvents, setCatEvents] = useState<{ category_id: string | null }[]>([]);
  const [weekViews, setWeekViews] = useState<Record<string, number>>({});
  const [popMap, setPopMap] = useState<Map<string, PopularityRow>>(new Map());
  const [orders7d, setOrders7d] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>('score');
  const [confirmDel, setConfirmDel] = useState<ProductRequest | null>(null);

  const load = async () => {
    setLoading(true);
    const [s, r, p, c, ce, wv, pop, o] = await Promise.all([
      supabase.from('product_events').select('query,meta').eq('event', 'search').gte('created_at', WINDOW_30).limit(1000),
      supabase.from('product_requests').select('*').order('created_at', { ascending: false }).limit(300),
      supabase.from('products').select('id,name,slug,category_id,base_price').eq('is_active', true).limit(400),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('product_events').select('category_id').in('event', ['view', 'cart_add', 'wishlist_add']).gte('created_at', WINDOW_30).limit(2000),
      supabase.from('product_events').select('product_id').eq('event', 'view').gte('created_at', WINDOW_7).limit(2000),
      fetchPopularity(),
      supabase.from('orders').select('id', { count: 'exact', head: true }).gte('placed_at', WINDOW_7).neq('status', 'cancelled'),
    ]);
    setSearches(((s.data ?? []) as { query: string | null; meta: { results?: number } }[]).filter((x) => x.query).map((x) => ({ query: x.query as string, meta: x.meta ?? {} })));
    setRequests((r.data ?? []) as ProductRequest[]);
    setProducts((p.data ?? []) as unknown as Product[]);
    setCats((c.data ?? []) as Category[]);
    setCatEvents((ce.data ?? []) as { category_id: string | null }[]);
    const wvMap: Record<string, number> = {};
    for (const row of (wv.data ?? []) as { product_id: string | null }[]) {
      if (row.product_id) wvMap[row.product_id] = (wvMap[row.product_id] ?? 0) + 1;
    }
    setWeekViews(wvMap);
    setPopMap(pop);
    setOrders7d(o.count ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const searchStats = useMemo(() => {
    const map = new Map<string, { count: number; zero: number; results: number[] }>();
    for (const s of searches) {
      const e = map.get(s.query) ?? { count: 0, zero: 0, results: [] as number[] };
      e.count++;
      const res = s.meta.results ?? 0;
      e.results.push(res);
      if (res === 0) e.zero++;
      map.set(s.query, e);
    }
    const rows = [...map.entries()]
      .map(([query, v]) => ({
        query,
        count: v.count,
        zero: v.zero,
        avgResults: v.results.length ? Math.round(v.results.reduce((a, b) => a + b, 0) / v.results.length) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
    return { rows };
  }, [searches]);

  const requestGroups = useMemo(() => {
    const map = new Map<string, { count: number; latest: ProductRequest; statuses: Set<string> }>();
    for (const r of requests) {
      const e = map.get(r.query) ?? { count: 0, latest: r, statuses: new Set<string>() };
      e.count++;
      if (new Date(r.created_at) > new Date(e.latest.created_at)) e.latest = r;
      e.statuses.add(r.status);
      map.set(r.query, e);
    }
    return [...map.entries()]
      .map(([query, v]) => ({ query, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [requests]);

  const heat = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    const rows = products.map((p) => {
      const pop = popMap.get(p.id);
      return {
        product: p,
        views: pop?.views_30d ?? 0,
        carts: pop?.carts_30d ?? 0,
        wishlists: pop?.wishlists_30d ?? 0,
        purchases: pop?.purchases_30d ?? 0,
        score: Number(pop?.score ?? 0),
        conversion: Number(pop?.conversion ?? 0),
        week: weekViews[p.id] ?? 0,
      };
    });
    const sorters: Record<SortKey, (a: (typeof rows)[number], b: (typeof rows)[number]) => number> = {
      score: (a, b) => b.score - a.score,
      views: (a, b) => b.views - a.views,
      purchases: (a, b) => b.purchases - a.purchases,
      conversion: (a, b) => b.conversion - a.conversion,
    };
    return rows.sort(sorters[sort]).slice(0, 20).filter((r) => r.score > 0 || r.views > 0 || r.purchases > 0);
  }, [products, popMap, weekViews, sort]);

  const catHeat = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of catEvents) {
      if (e.category_id) counts.set(e.category_id, (counts.get(e.category_id) ?? 0) + 1);
    }
    const max = Math.max(1, ...counts.values());
    return cats
      .map((c) => ({ cat: c, count: counts.get(c.id) ?? 0, pct: ((counts.get(c.id) ?? 0) / max) * 100 }))
      .sort((a, b) => b.count - a.count);
  }, [cats, catEvents]);

  const pendingRequests = requests.filter((r) => r.status === 'pending').length;

  if (loading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm text-ink/60">
        What shoppers actually want — searches, requests, views, wishlists, carts and real purchases.
        Use it to decide what to source next. Counts only, never who.
      </p>

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Searches · 30d', value: String(searches.length) },
          { label: 'Zero-result searches', value: String(searchStats.rows.reduce((s, r) => s + r.zero, 0)) },
          { label: 'Pending requests', value: String(pendingRequests) },
          { label: 'Orders · 7d', value: String(orders7d) },
        ].map((c) => (
          <Card key={c.label} className="p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-ink/50">{c.label}</p>
            <p className="mt-1 font-display text-2xl font-black">{c.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Top searches */}
        <Card className="h-fit p-5">
          <h2 className="font-display font-extrabold">Top searches</h2>
          <p className="text-xs text-ink/50">Zero-result rows are sourcing opportunities.</p>
          {searchStats.rows.length === 0 ? (
            <p className="mt-3 text-sm text-ink/60">No searches logged yet.</p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {searchStats.rows.map((r) => (
                <li key={r.query} className="flex items-center gap-2 rounded-xl bg-paper px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate font-semibold">“{r.query}”</span>
                  {r.zero > 0 && <Badge tone="red">{r.zero}× no result</Badge>}
                  <span className="shrink-0 text-xs text-ink/50">{r.count}× · ~{r.avgResults} hits</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Requests */}
        <Card className="h-fit p-5">
          <h2 className="font-display font-extrabold">Requested products</h2>
          <p className="text-xs text-ink/50">Grouped by ask — count is distinct shoppers wanting it.</p>
          {requestGroups.length === 0 ? (
            <p className="mt-3 text-sm text-ink/60">No requests yet. They appear when searches find nothing.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {requestGroups.map((g) => (
                <li key={g.query} className="rounded-xl bg-paper px-3 py-2.5">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate font-bold">“{g.query}”</span>
                    <Badge tone="ember">{g.count} ask{g.count === 1 ? '' : 's'}</Badge>
                    <Badge tone={g.latest.status === 'pending' ? 'paper' : g.latest.status === 'sourced' ? 'green' : 'red'}>
                      {g.latest.status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <select
                      value={g.latest.status}
                      disabled={readOnly}
                      onChange={(e) => {
                        const status = e.target.value;
                        supabase.from('product_requests').update({ status }).eq('id', g.latest.id).then(({ error }) => {
                          if (!error) {
                            log('request.status', 'product_requests', g.latest.id, { status });
                            setRequests(requests.map((x) => (x.id === g.latest.id ? { ...x, status: status as ProductRequest['status'] } : x)));
                          }
                        });
                      }}
                      className="rounded-full border border-ink/15 bg-white px-3 py-1 text-xs font-bold disabled:opacity-60"
                      aria-label="Request status"
                    >
                      <option value="pending">pending</option>
                      <option value="sourced">sourced</option>
                      <option value="rejected">rejected</option>
                    </select>
                    {!readOnly && (
                      <button
                        onClick={() => setConfirmDel(g.latest)}
                        className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700"
                      >
                        Delete
                      </button>
                    )}
                    <span className="ml-auto text-[11px] text-ink/40">
                      latest {new Date(g.latest.created_at).toLocaleDateString('en-NP', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Category heat */}
      <Card className="p-5">
        <h2 className="font-display font-extrabold">Category heat · 30d</h2>
        <ul className="mt-3 space-y-2">
          {catHeat.map(({ cat, count, pct }) => (
            <li key={cat.id} className="text-sm">
              <span className="flex justify-between gap-2">
                <strong className="truncate">{cat.name}</strong>
                <span className="shrink-0 text-ink/50">{count} actions</span>
              </span>
              <span className="mt-1 block h-2 overflow-hidden rounded-full bg-ink/10">
                <span className="block h-full rounded-full bg-ember" style={{ width: `${pct}%` }} />
              </span>
            </li>
          ))}
          {catHeat.every((c) => c.count === 0) && <li className="text-sm text-ink/60">No activity yet.</li>}
        </ul>
      </Card>

      {/* Product heat */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display font-extrabold">Product heat · 30d</h2>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="ml-auto rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs font-bold"
            aria-label="Sort heat"
          >
            <option value="score">Top score</option>
            <option value="views">Most viewed</option>
            <option value="purchases">Most purchased</option>
            <option value="conversion">Best conversion</option>
          </select>
        </div>
        {heat.length === 0 ? (
          <div className="mt-3"><EmptyState title="No signals yet" body="Views, wishlists, carts and purchases will rank products here automatically." /></div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-xs uppercase tracking-wider text-ink/50">
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2 text-right">Views</th>
                  <th className="px-3 py-2 text-right">7d</th>
                  <th className="px-3 py-2 text-right">Lists</th>
                  <th className="px-3 py-2 text-right">Carts</th>
                  <th className="px-3 py-2 text-right">Sold</th>
                  <th className="px-3 py-2 text-right">Conv.</th>
                </tr>
              </thead>
              <tbody>
                {heat.map((r) => (
                  <tr key={r.product.id} className="border-b border-ink/5 last:border-0">
                    <td className="px-3 py-2">
                      <p className="font-bold">{r.product.name}</p>
                      <p className="text-xs text-ink/50">{formatNPR(r.product.base_price)}</p>
                    </td>
                    <td className="px-3 py-2 text-right">{r.views}</td>
                    <td className="px-3 py-2 text-right font-bold text-ember">{r.week}</td>
                    <td className="px-3 py-2 text-right">{r.wishlists}</td>
                    <td className="px-3 py-2 text-right">{r.carts}</td>
                    <td className="px-3 py-2 text-right">{r.purchases}</td>
                    <td className="px-3 py-2 text-right">{(r.conversion * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        title="Delete request?"
        body="This removes the request record. The demand count for this query drops accordingly."
        confirmLabel="Delete"
        onConfirm={() => {
          if (!confirmDel) return;
          supabase.from('product_requests').delete().eq('id', confirmDel.id).then(() => {
            log('request.delete', 'product_requests', confirmDel.id, {});
            setRequests(requests.filter((x) => x.id !== confirmDel.id));
          });
        }}
      />
    </div>
  );
}
