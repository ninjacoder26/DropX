import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Loader2, Star, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isCloudinaryConfigured, uploadToCloudinary, validateImageFile } from '../lib/cloudinary';
import { processImageBackground } from '../lib/bgremove';
import type { ProductImage } from '../types';
import { Button } from './ui';

interface PendingImage {
  key: number;
  file: File;
  origUrl: string;
  procUrl: string | null;
  procFile: File | null;
  useProc: boolean;
  note: string;
}

/**
 * Admin image manager: upload (Cloudinary) → preview → reorder → replace → remove.
 * Rows persist in Supabase product_images; bytes live in Cloudinary.
 * allowManage=false keeps upload + remove but hides reorder/primary/hide,
 * which subadmins may not touch (RLS would reject them anyway).
 */
export function ImageManager({ productId, allowManage = true }: { productId: string; allowManage?: boolean }) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bgRemove, setBgRemove] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [review, setReview] = useState<PendingImage[] | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order');
    setImages((data ?? []) as ProductImage[]);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function uploadChosen(items: { file: File; name: string }[], token: string | undefined) {
    for (const item of items) {
      const up = await uploadToCloudinary(item.file, token ?? undefined);
      const { error: dbErr } = await supabase.from('product_images').insert({
        product_id: productId,
        cloudinary_public_id: up.public_id,
        secure_url: up.secure_url,
        alt_text: item.name.replace(/\.[^.]+$/, ''),
        width: up.width,
        height: up.height,
        bytes: up.bytes,
        format: up.format,
        sort_order: images.length,
        is_primary: images.length === 0,
      });
      if (dbErr) throw new Error(dbErr.message);
    }
  }

  function clearReview() {
    setReview((prev) => {
      for (const p of prev ?? []) {
        URL.revokeObjectURL(p.origUrl);
        if (p.procUrl) URL.revokeObjectURL(p.procUrl);
      }
      return null;
    });
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    for (const f of Array.from(files)) {
      const v = validateImageFile(f);
      if (v) {
        setError(v);
        continue;
      }
    }
    // Plain path — exactly the old behavior: straight to Cloudinary.
    if (!bgRemove) {
      setBusy(true);
      const { data: session } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      try {
        await uploadChosen(
          Array.from(files).map((f) => ({ file: f, name: f.name })),
          session.session?.access_token
        );
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed.');
      } finally {
        setBusy(false);
      }
      return;
    }
    // BG-removal path: clean locally first, preview, upload on confirm.
    const list = Array.from(files);
    const pending: PendingImage[] = [];
    try {
      for (let i = 0; i < list.length; i++) {
        setProcessing(`Removing background ${i + 1} of ${list.length}…`);
        const f = list[i];
        const origUrl = URL.createObjectURL(f);
        const out = await processImageBackground(f).catch(() => null);
        if (out?.removed && out.blob) {
          const clean = new File([out.blob], f.name.replace(/\.[^.]+$/, '') + '-bgwhite.png', { type: 'image/png' });
          pending.push({
            key: i,
            file: f,
            origUrl,
            procUrl: URL.createObjectURL(clean),
            procFile: clean,
            useProc: true,
            note: `Background removed (${out.reason}, ${Math.round(out.removedFraction * 100)}% cleared).`,
          });
        } else {
          pending.push({
            key: i,
            file: f,
            origUrl,
            procUrl: null,
            procFile: null,
            useProc: false,
            note: out ? `Kept original — ${out.reason}.` : 'Kept original — processing failed.',
          });
        }
      }
      setReview(pending);
    } finally {
      setProcessing(null);
    }
  }

  async function confirmReview() {
    if (!review?.length) return;
    setBusy(true);
    setError(null);
    const { data: session } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
    try {
      await uploadChosen(
        review.map((p) => ({
          file: p.useProc && p.procFile ? p.procFile : p.file,
          name: p.file.name,
        })),
        session.session?.access_token
      );
      clearReview();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = images.findIndex((i) => i.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= images.length) return;
    const next = [...images];
    [next[idx], next[j]] = [next[j], next[idx]];
    setImages(next);
    await Promise.all(
      next.map((im, k) => supabase.from('product_images').update({ sort_order: k }).eq('id', im.id))
    );
  }

  async function setPrimary(id: string) {
    await supabase.from('product_images').update({ is_primary: false }).eq('product_id', productId);
    await supabase.from('product_images').update({ is_primary: true }).eq('id', id);
    await load();
  }

  async function remove(im: ProductImage) {
    if (!confirm(`Delete this image?\n\nIt will be removed from the product. Cloudinary asset cleanup runs server-side where configured.`)) return;
    // Best-effort server-side asset deletion with the admin's session token
    // (the endpoint verifies the admin role; failures never block the DB row).
    try {
      const { data: session } = await supabase.auth.getSession();
      await fetch('/api/cloudinary-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session.session ? { Authorization: `Bearer ${session.session.access_token}` } : {}),
        },
        body: JSON.stringify({ public_id: im.cloudinary_public_id }),
      });
    } catch {
      /* non-blocking */
    }
    await supabase.from('product_images').delete().eq('id', im.id);
    await load();
  }

  return (
    <div className="rounded-2xl border border-ink/10 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">Images ({images.length})</p>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-bold text-paper hover:bg-ink-soft">
          <ImagePlus size={14} /> {busy ? 'Uploading…' : 'Upload'}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="hidden" onChange={(e) => void handleFiles(e.target.files)} disabled={busy || processing !== null || review !== null} />
        </label>
      </div>
      <label
        className="mt-2 flex cursor-pointer items-start gap-2 text-xs text-ink/70"
        title="Cuts a plain backdrop to white on your device before upload. Uncertain or busy backgrounds are left untouched."
      >
        <input
          type="checkbox"
          checked={bgRemove}
          onChange={(e) => setBgRemove(e.target.checked)}
          disabled={busy || processing !== null || review !== null}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#F06427]"
        />
        <span>
          <strong className="text-ink">BG Removal</strong> — clean solid backgrounds to white before upload.{' '}
          <span className="text-ink/50">You preview each result first; originals are kept when unsure.</span>
        </span>
      </label>
      {processing && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-ember" role="status">
          <Loader2 size={13} className="animate-spin" /> {processing}
        </p>
      )}
      {review && (
        <div className="mt-3 rounded-2xl border border-ink/10 bg-white p-3">
          <p className="text-xs font-bold">Preview — {review.length} image{review.length === 1 ? '' : 's'}</p>
          <ul className="mt-2 space-y-3">
            {review.map((p) => (
              <li key={p.key} className="rounded-xl bg-paper p-2">
                <div className="grid grid-cols-2 gap-2">
                  <figure>
                    <img src={p.origUrl} alt="Original" className="aspect-square w-full rounded-lg object-cover ring-1 ring-ink/10" />
                    <figcaption className="mt-1 text-center text-[10px] font-bold uppercase tracking-wider text-ink/50">Original</figcaption>
                  </figure>
                  <figure>
                    {p.procUrl ? (
                      <img src={p.procUrl} alt="Background removed" className="aspect-square w-full rounded-lg object-cover ring-1 ring-ember/40" />
                    ) : (
                      <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-paper-dark p-2 text-center text-[11px] text-ink/50 ring-1 ring-ink/10">
                        No clean version
                      </div>
                    )}
                    <figcaption className="mt-1 text-center text-[10px] font-bold uppercase tracking-wider text-ink/50">White background</figcaption>
                  </figure>
                </div>
                <p className="mt-1.5 text-[11px] text-ink/60">{p.note}</p>
                {p.procFile && (
                  <label className="mt-1 flex cursor-pointer items-center gap-1.5 text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={p.useProc}
                      onChange={(e) => setReview((prev) => (prev ?? []).map((q) => (q.key === p.key ? { ...q, useProc: e.target.checked } : q)))}
                      className="h-4 w-4 accent-[#F06427]"
                    />
                    Upload the cleaned version
                  </label>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" onClick={clearReview} disabled={busy}>Discard</Button>
            <Button onClick={() => void confirmReview()} disabled={busy}>
              {busy ? 'Uploading…' : `Upload ${review.length} image${review.length === 1 ? '' : 's'}`}
            </Button>
          </div>
        </div>
      )}
      {!isCloudinaryConfigured && (
        <p className="mt-2 rounded-xl bg-ember/10 px-3 py-2 text-xs text-ink/70">
          Cloudinary is not configured (cloudinaryCloudName + cloudinaryUploadPreset in src/config.ts). Uploads are disabled until configured.
        </p>
      )}
      {error && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      <p className="mt-2 text-[11px] text-ink/40">Photos are auto-compressed (≤1600px WebP) before upload to save bandwidth.</p>
      {images.length === 0 ? (
        <p className="mt-3 text-xs text-ink/50">No images yet. Upload product photography here.</p>
      ) : (
        <ul className="mt-3 grid grid-cols-3 gap-2">
          {images.map((im) => (
            <li key={im.id} className="group relative overflow-hidden rounded-xl bg-paper-dark ring-1 ring-ink/10">
              <img
                src={im.secure_url}
                alt={im.alt_text}
                loading="lazy"
                className={`aspect-square w-full object-cover ${im.is_hidden ? 'opacity-40 grayscale' : ''}`}
              />
              {im.is_primary && !im.is_hidden && (
                <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded-full bg-ember px-2 py-0.5 text-[10px] font-bold text-white">
                  <Star size={9} /> PRIMARY
                </span>
              )}
              {im.is_hidden && (
                <span className="absolute left-1 top-1 rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-paper">
                  HIDDEN — under dispute
                </span>
              )}
              <div className="absolute inset-x-1 bottom-1 flex justify-center gap-1 opacity-0 transition group-hover:opacity-100">
                {allowManage && (
                  <>
                    <button onClick={() => void move(im.id, -1)} className="rounded-full bg-white p-1.5 shadow" aria-label="Move left"><ArrowUp size={12} className="-rotate-90" /></button>
                    <button onClick={() => void move(im.id, 1)} className="rounded-full bg-white p-1.5 shadow" aria-label="Move right"><ArrowDown size={12} className="-rotate-90" /></button>
                    {!im.is_primary && (
                      <button onClick={() => void setPrimary(im.id)} className="rounded-full bg-white p-1.5 shadow" aria-label="Set primary"><Star size={12} /></button>
                    )}
                    <button
                      onClick={() => {
                        supabase.from('product_images').update({ is_hidden: !im.is_hidden }).eq('id', im.id).then(() => void load());
                      }}
                      className="rounded-full bg-white p-1.5 shadow"
                      aria-label={im.is_hidden ? 'Unhide image' : 'Hide image from storefront'}
                      title={im.is_hidden ? 'Unhide image' : 'Hide image from storefront'}
                    >
                      {im.is_hidden ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                  </>
                )}
                <button onClick={() => void remove(im)} className="rounded-full bg-red-600 p-1.5 text-white shadow" aria-label="Delete image"><Trash2 size={12} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex justify-end">
        <Button variant="ghost" onClick={() => void load()}>Refresh</Button>
      </div>
    </div>
  );
}
