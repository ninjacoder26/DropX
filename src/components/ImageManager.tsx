import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isCloudinaryConfigured, uploadToCloudinary, validateImageFile } from '../lib/cloudinary';
import type { ProductImage } from '../types';
import { Button } from './ui';

/**
 * Admin image manager: upload (Cloudinary) → preview → reorder → replace → remove.
 * Rows persist in Supabase product_images; bytes live in Cloudinary.
 */
export function ImageManager({ productId }: { productId: string }) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setBusy(true);
    try {
      for (const f of Array.from(files)) {
        const up = await uploadToCloudinary(f);
        const { error: dbErr } = await supabase.from('product_images').insert({
          product_id: productId,
          cloudinary_public_id: up.public_id,
          secure_url: up.secure_url,
          alt_text: f.name.replace(/\.[^.]+$/, ''),
          width: up.width,
          height: up.height,
          bytes: up.bytes,
          format: up.format,
          sort_order: images.length,
          is_primary: images.length === 0,
        });
        if (dbErr) throw new Error(dbErr.message);
      }
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
    // Best-effort server-side asset deletion (requires CLOUDINARY_API_SECRET on server)
    try {
      await fetch('/api/cloudinary-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="hidden" onChange={(e) => void handleFiles(e.target.files)} disabled={busy} />
        </label>
      </div>
      {!isCloudinaryConfigured && (
        <p className="mt-2 rounded-xl bg-ember/10 px-3 py-2 text-xs text-ink/70">
          Cloudinary is not configured (cloudinaryCloudName + cloudinaryUploadPreset in src/config.ts). Uploads are disabled until configured.
        </p>
      )}
      {error && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      {images.length === 0 ? (
        <p className="mt-3 text-xs text-ink/50">No images yet. Upload product photography here.</p>
      ) : (
        <ul className="mt-3 grid grid-cols-3 gap-2">
          {images.map((im) => (
            <li key={im.id} className="group relative overflow-hidden rounded-xl bg-paper-dark ring-1 ring-ink/10">
              <img src={im.secure_url} alt={im.alt_text} className="aspect-square w-full object-cover" loading="lazy" />
              {im.is_primary && (
                <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded-full bg-ember px-2 py-0.5 text-[10px] font-bold text-white">
                  <Star size={9} /> PRIMARY
                </span>
              )}
              <div className="absolute inset-x-1 bottom-1 flex justify-center gap-1 opacity-0 transition group-hover:opacity-100">
                <button onClick={() => void move(im.id, -1)} className="rounded-full bg-white p-1.5 shadow" aria-label="Move left"><ArrowUp size={12} className="-rotate-90" /></button>
                <button onClick={() => void move(im.id, 1)} className="rounded-full bg-white p-1.5 shadow" aria-label="Move right"><ArrowDown size={12} className="-rotate-90" /></button>
                {!im.is_primary && (
                  <button onClick={() => void setPrimary(im.id)} className="rounded-full bg-white p-1.5 shadow" aria-label="Set primary"><Star size={12} /></button>
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
