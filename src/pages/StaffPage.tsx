import { useEffect, useMemo, useState } from 'react';
import { Camera, KeyRound, LogOut, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { StaffImageManager } from '../components/StaffImageManager';
import { Button, EmptyState, Field, Input, Notice, Skeleton } from '../components/ui';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatNPR } from '../lib/shop';

interface Row {
  id: string;
  name: string;
  brand: string | null;
  base_price: number;
}

export default function StaffPage() {
  const { user, profile, signOut } = useAuth();
  usePageTitle('Staff portal');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Row | null>(null);
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwOk, setPwOk] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: prods }, { data: imgs }] = await Promise.all([
        supabase
          .from('products')
          .select('id,name,brand,base_price')
          .eq('is_active', true)
          .order('name')
          .limit(300),
        supabase.from('product_images').select('product_id'),
      ]).catch(() => [{ data: null }, { data: null }]);
      const list = (prods ?? []) as Row[];
      setRows(list);
      const map: Record<string, number> = {};
      for (const r of (imgs ?? []) as { product_id: string }[]) {
        map[r.product_id] = (map[r.product_id] ?? 0) + 1;
      }
      setCounts(map);
      // Open the first product right away — no empty panel, no hunting.
      setSelected((prev) => prev ?? list[0] ?? null);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) => r.name.toLowerCase().includes(s) || (r.brand ?? '').toLowerCase().includes(s)
    );
  }, [rows, q]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ember">DropX staff</p>
          <h1 className="font-display text-3xl font-black">Product photos</h1>
          <p className="mt-1 text-sm text-ink/60">
            Signed in as <strong className="text-ink">{profile?.username ?? user?.email}</strong> — you can add or
            remove product images. Nothing else here can be changed or deleted.
          </p>
        </div>
        <Button variant="outline" onClick={() => void signOut()}>
          <LogOut size={15} /> Sign out
        </Button>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[340px_1fr]">
        <section className="h-fit rounded-2xl bg-white p-4 shadow-card ring-1 ring-ink/5 lg:sticky lg:top-24">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" aria-label="Search products" className="pl-9" />
          </div>
          {loading ? (
            <div className="mt-3 space-y-2"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
          ) : filtered.length === 0 ? (
            <p className="mt-3 text-sm text-ink/50">No products match.</p>
          ) : (
            <ul className="mt-3 max-h-[26rem] space-y-1 overflow-y-auto">
              {filtered.map((r) => {
                const n = counts[r.id] ?? 0;
                const active = selected?.id === r.id;
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => setSelected(r)}
                      aria-pressed={active}
                      className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${
                        active ? 'bg-ink text-paper' : 'hover:bg-ink/5'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="block min-w-0 flex-1 truncate font-bold">{r.name}</span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            n === 0
                              ? 'bg-ember text-white'
                              : active
                                ? 'bg-paper/20 text-paper'
                                : 'bg-ink/10 text-ink/60'
                          }`}
                        >
                          {n === 0 ? 'NO PHOTOS' : `${n} photo${n === 1 ? '' : 's'}`}
                        </span>
                      </span>
                      <span className={`block text-xs ${active ? 'text-paper/60' : 'text-ink/50'}`}>
                        {r.brand || 'No brand'} · {formatNPR(r.base_price)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="min-w-0 space-y-5">
          {selected ? (
            <section className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink/5">
              <h2 className="flex items-center gap-2 font-display text-lg font-extrabold">
                <Camera size={17} className="text-ember" /> {selected.name}
              </h2>
              <p className="mt-1 text-xs text-ink/50">{selected.brand || 'No brand'} · {formatNPR(selected.base_price)}</p>
              <div className="mt-3">
                <StaffImageManager
                  key={selected.id}
                  productId={selected.id}
                  onCount={(n) => setCounts((m) => ({ ...m, [selected.id]: n }))}
                />
              </div>
            </section>
          ) : (
            <EmptyState title="No products" body="Nothing to photograph yet — products will appear here." />
          )}

          <section className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink/5">
            <h2 className="flex items-center gap-2 font-display text-lg font-extrabold">
              <KeyRound size={17} className="text-ember" /> Change password
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="New password (min 8)">
                <Input type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} autoComplete="new-password" />
              </Field>
              <Field label="Repeat new password">
                <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
              </Field>
            </div>
            {pwMsg && (
              <div className="mt-3">
                <Notice tone={pwOk ? 'success' : 'error'}>{pwMsg}</Notice>
              </div>
            )}
            <Button
              variant="dark"
              className="mt-3"
              disabled={pwBusy}
              onClick={() => {
                setPwMsg(null);
                if (pw1.length < 8) {
                  setPwOk(false);
                  setPwMsg('Password must be at least 8 characters.');
                  return;
                }
                if (pw1 !== pw2) {
                  setPwOk(false);
                  setPwMsg('Passwords do not match.');
                  return;
                }
                setPwBusy(true);
                supabase.auth.updateUser({ password: pw1 }).then(({ error }) => {
                  setPwBusy(false);
                  if (error) {
                    setPwOk(false);
                    setPwMsg(error.message);
                  } else {
                    setPwOk(true);
                    setPwMsg('Password changed.');
                    setPw1('');
                    setPw2('');
                  }
                }, () => {
                  setPwBusy(false);
                  setPwOk(false);
                  setPwMsg('Could not reach the server. Try again.');
                });
              }}
            >
              {pwBusy ? 'Saving…' : 'Save new password'}
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}

