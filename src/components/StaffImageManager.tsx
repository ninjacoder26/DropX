import { useEffect, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isCloudinaryConfigured, uploadToCloudinary, validateImageFile } from '../lib/cloudinary';
import type { ProductImage } from '../types';
import { Button } from './ui';

/**
 * Staff photo box: upload + remove only. No reorder, no primary star, no
 * hide toggle — subadmins get exactly the two actions RLS allows them, so
 * there are no dead buttons that silently fail.
 */
export function StaffImageManager({
  productId,
  onCount,
}: {
  productId: string;
  onCount?: (n: number) => void;
}) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order');
    const rows = (data ?? []) as ProductImage[];
    setImages(rows);
    onCount?.(rows.length);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length || busy) return;
    setError(null);
    const list = Array.from(files);
    for (const f of list) {
      const v = validateImageFile(f);
      if (v) {
        setError(v);
        return;
      }
    }
    setBusy(true);
    try {
      const { data: session } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      const token = session.session?.access_token;
      const base = images.length;
      for (let i = 0; i < list.length; i++) {
        const f = list[i];
        const up = await uploadToCloudinary(f, token ?? undefined);
        const { error: dbErr } = await supabase.from('product_images').insert({
          product_id: productId,
          cloudinary_public_id: up.public_id,
          secure_url: up.secure_url,
          alt_text: f.name.replace(/\.[^.]+$/, ''),
          width: up.width,
          height: up.height,
          bytes: up.bytes,
          format: up.format,
          sort_order: base + i,
          is_primary: base + i === 0,
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

  async function remove(im: ProductImage) {
    if (!confirm(`Remove this photo from the product?`)) return;
    setError(null);
    try {
      const { data: session } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      await fetch('/api/cloudinary-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session.session ? { Authorization: `Bearer ${session.session.access_token}` } : {}),
        },
        body: JSON.stringify({ public_id: im.cloudinary_public_id }),
      }).catch(() => undefined);
      const { error: dbErr } = await supabase.from('product_images').delete().eq('id', im.id);
      if (dbErr) throw new Error(dbErr.message);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove photo.');
    }
  }

  return (
    <div>
      <label
        className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-4 py-7 text-sm font-bold transition ${
          busy ? 'cursor-wait border-ink/10 text-ink/40' : 'border-ember/50 bg-ember/5 text-ink hover:border-ember'
        }`}
      >
        {busy ? <Loader2 size={22} className="animate-spin text-ember" /> : <ImagePlus size={22} className="text-ember" />}
        {busy ? 'Uploading…' : 'Tap to add photos'}
        <span className="text-[11px] font-semibold text-ink/50">JPG, PNG, WebP or AVIF · auto-compressed</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </label>
      {!isCloudinaryConfigured && (
        <p className="mt-2 text-xs text-ink/50">Uploads are disabled until Cloudinary is configured.</p>
      )}
      {error && (
        <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700" role="alert">
          {error}
        </p>
      )}
      {images.length === 0 ? (
        <p className="mt-3 text-center text-sm text-ink/50">No photos yet — add the first one above.</p>
      ) : (
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((im, i) => (
            <li key={im.id} className="group relative overflow-hidden rounded-xl bg-paper-dark ring-1 ring-ink/10">
              <img src={im.secure_url} alt={im.alt_text || `Photo ${i + 1}`} loading="lazy" className="aspect-square w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-paper">
                  MAIN
                </span>
              )}
              <button
                onClick={() => void remove(im)}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute right-1 top-1 rounded-full bg-red-600 p-1.5 text-white shadow transition hover:bg-red-700 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex justify-end">
        <Button variant="ghost" onClick={() => void load()} disabled={busy}>Refresh</Button>
      </div>
    </div>
  );
}
