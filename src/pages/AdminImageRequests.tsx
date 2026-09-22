import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { logAdminAction as log } from '../lib/admin';
import type { ImageRequest, ImageRequestNote, ImageRequestStatus } from '../types';
import { formatNPR } from '../lib/shop';
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, Skeleton } from '../components/ui';

const STATUSES: ImageRequestStatus[] = ['pending', 'reviewed', 'resolved', 'rejected'];

export default function AdminImageRequests() {
  const [items, setItems] = useState<(ImageRequest & { product_name?: string; product_slug?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | ImageRequestStatus>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, ImageRequestNote[]>>({});
  const [draft, setDraft] = useState('');
  const [noteBusy, setNoteBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState<ImageRequest | null>(null);
  const [hiddenMap, setHiddenMap] = useState<Record<string, { id: string; is_hidden: boolean }>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('image_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(150);
    const rows = (data ?? []) as ImageRequest[];
    const pids = [...new Set(rows.map((r) => r.product_id))];
    let names = new Map<string, { name: string; slug: string }>();
    if (pids.length > 0) {
      const { data: prods } = await supabase.from('products').select('id,name,slug').in('id', pids);
      names = new Map(((prods ?? []) as { id: string; name: string; slug: string }[]).map((p) => [p.id, p]));
    }
    // Hidden state of each disputed image (admin sees hidden rows too).
    const imgs = await Promise.all(
      rows.map((r) =>
        supabase.from('product_images').select('id,is_hidden').eq('product_id', r.product_id).eq('secure_url', r.image_url).limit(1).single()
      )
    );
    const hm: Record<string, { id: string; is_hidden: boolean }> = {};
    rows.forEach((r, i) => {
      const row = imgs[i].data as { id: string; is_hidden: boolean } | null;
      if (row) hm[r.id] = row;
    });
    setHiddenMap(hm);
    setItems(rows.map((r) => ({ ...r, product_name: names.get(r.product_id)?.name, product_slug: names.get(r.product_id)?.slug })));
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const openNotes = async (id: string) => {
    setExpanded(expanded === id ? null : id);
    if (expanded !== id && !notes[id]) {
      const { data } = await supabase.from('image_request_notes').select('*').eq('request_id', id).order('created_at');
      setNotes((prev) => ({ ...prev, [id]: (data ?? []) as ImageRequestNote[] }));
    }
  };

  const addNote = async (id: string) => {
    const text = draft.trim();
    if (!text) return;
    setNoteBusy(true);
    const { data: session } = await supabase.auth.getSession();
    const { data, error } = await supabase
      .from('image_request_notes')
      .insert({ request_id: id, admin_id: session.session?.user.id ?? null, note: text.slice(0, 2000) })
      .select()
      .single();
    if (!error && data) {
      setNotes((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), data as ImageRequestNote] }));
      setDraft('');
      log('imagerequest.note', 'image_requests', id, {});
    }
    setNoteBusy(false);
  };

  const setStatus = async (r: ImageRequest, status: ImageRequestStatus) => {
    const { error } = await supabase.from('image_requests').update({ status }).eq('id', r.id);
    if (!error) {
      log('imagerequest.status', 'image_requests', r.id, { status });
      setItems(items.map((x) => (x.id === r.id ? { ...x, status } : x)));
    }
  };

  const toggleHidden = async (r: ImageRequest) => {
    const row = hiddenMap[r.id];
    if (!row) return;
    const next = !row.is_hidden;
    if (!confirm(`${next ? 'Hide' : 'Restore'} this image on the storefront?\n\nThe product itself stays live — only this photo is affected.`)) return;
    const { error } = await supabase.from('product_images').update({ is_hidden: next }).eq('id', row.id);
    if (!error) {
      log(next ? 'image.hide' : 'image.unhide', 'product_images', row.id, { request: r.id });
      setHiddenMap({ ...hiddenMap, [r.id]: { ...row, is_hidden: next } });
    }
  };

  const shown = filter === 'all' ? items : items.filter((r) => r.status === filter);
  const pending = items.filter((r) => r.status === 'pending').length;

  if (loading) return <Skeleton className="h-64" />;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-ink/60">
          Rights-holder reports. Nothing is auto-removed — review, then resolve, reject, or hide the photo.
        </p>
        <div className="ml-auto flex gap-1.5">
          {(['all', 'pending', 'reviewed', 'resolved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${filter === f ? 'bg-ink text-paper' : 'bg-white ring-1 ring-ink/10'}`}
            >
              {f === 'all' ? `All (${items.length})` : f}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title={pending === 0 && items.length === 0 ? 'No image reports' : 'Nothing in this state'}
            body="New submissions arrive here instantly with a notification."
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {shown.map((r) => {
            const hidden = hiddenMap[r.id]?.is_hidden;
            const isOpen = expanded === r.id;
            return (
              <li key={r.id}>
                <Card className="p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    {r.image_url && (
                      <img src={r.image_url} alt="" loading="lazy" className="h-14 w-14 rounded-xl object-cover ring-1 ring-ink/10" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display font-bold">
                        {r.brand_name} <span className="font-body text-xs font-normal text-ink/50">· {r.product_name ?? 'product removed'}</span>
                      </p>
                      <p className="truncate text-xs text-ink/50">
                        {new Date(r.created_at).toLocaleString('en-NP')} · {r.contact_email}
                      </p>
                    </div>
                    <span className="flex flex-wrap gap-1.5">
                      <Badge tone={r.status === 'pending' ? 'ember' : r.status === 'resolved' ? 'green' : r.status === 'rejected' ? 'red' : 'paper'}>
                        {r.status}
                      </Badge>
                      {hidden && <Badge tone="red">photo hidden</Badge>}
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-2 text-sm text-ink/70">{r.reason}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <button onClick={() => void openNotes(r.id)} className="rounded-full bg-ink/5 px-3.5 py-1.5 text-xs font-bold hover:bg-ink/10" aria-expanded={isOpen}>
                      {isOpen ? 'Hide details' : 'Review'}
                    </button>
                    <select
                      value={r.status}
                      onChange={(e) => void setStatus(r, e.target.value as ImageRequestStatus)}
                      className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs font-bold"
                      aria-label="Request status"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {hiddenMap[r.id] && (
                      <button onClick={() => void toggleHidden(r)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${hidden ? 'bg-ember text-white' : 'bg-ink/5 hover:bg-ink/10'}`}>
                        {hidden ? 'Restore photo' : 'Hide photo'}
                      </button>
                    )}
                    <button onClick={() => setConfirmDel(r)} className="rounded-full bg-red-100 px-3.5 py-1.5 text-xs font-bold text-red-700">
                      Delete
                    </button>
                  </div>

                  {isOpen && (
                    <div className="mt-3 rounded-2xl bg-paper p-4 text-sm">
                      <dl className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <dt className="text-[11px] font-bold uppercase tracking-widest text-ink/40">Product</dt>
                          <dd className="font-semibold">
                            {r.product_slug ? (
                              <Link to={`/product/${r.product_slug}`} target="_blank" rel="noreferrer" className="text-ember hover:underline">
                                {r.product_name ?? r.product_id.slice(0, 8)}
                              </Link>
                            ) : (r.product_name ?? '—')}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[11px] font-bold uppercase tracking-widest text-ink/40">Claimant email</dt>
                          <dd className="font-semibold">{r.contact_email}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-[11px] font-bold uppercase tracking-widest text-ink/40">Claimant product URL</dt>
                          <dd className="break-all font-mono text-xs">{r.product_url || '—'}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-[11px] font-bold uppercase tracking-widest text-ink/40">Full reason</dt>
                          <dd className="whitespace-pre-line">{r.reason}</dd>
                        </div>
                      </dl>

                      <div className="mt-4 border-t border-ink/10 pt-3">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-ink/40">Internal notes (admins only)</p>
                        <ul className="mt-2 space-y-1.5">
                          {(notes[r.id] ?? []).map((n) => (
                            <li key={n.id} className="rounded-lg bg-white px-3 py-2 text-xs ring-1 ring-ink/5">
                              <p>{n.note}</p>
                              <p className="mt-0.5 text-[10px] text-ink/40">{new Date(n.created_at).toLocaleString('en-NP')}</p>
                            </li>
                          ))}
                          {(notes[r.id] ?? []).length === 0 && (
                            <li className="text-xs text-ink/50">No notes yet.</li>
                          )}
                        </ul>
                        <div className="mt-2 flex gap-2">
                          <input
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            placeholder="Add an internal note…"
                            maxLength={2000}
                            className="flex-1 rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs"
                            aria-label="Internal note"
                          />
                          <Button variant="dark" onClick={() => void addNote(r.id)} disabled={noteBusy || !draft.trim()}>
                            {noteBusy ? '…' : 'Add'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        title="Delete request?"
        body="This removes the report record. Use Resolve/Reject to keep history instead."
        confirmLabel="Delete"
        onConfirm={() => {
          if (!confirmDel) return;
          supabase.from('image_requests').delete().eq('id', confirmDel.id).then(() => {
            log('imagerequest.delete', 'image_requests', confirmDel.id, {});
            setItems(items.filter((x) => x.id !== confirmDel.id));
          });
        }}
      />
    </div>
  );
}
