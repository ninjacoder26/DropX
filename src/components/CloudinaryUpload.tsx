import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { isCloudinaryConfigured, uploadToCloudinary } from '../lib/cloudinary';
import { cloudinaryThumb } from '../lib/shop';

/**
 * Reusable single-image Cloudinary upload field.
 * Used for category tiles, drop artwork, and anywhere else a picture —
 * but never a secret — is needed. Files go to Cloudinary; only the URL
 * string is stored in Supabase.
 */
export function CloudinaryUpload({
  value,
  onChange,
  label = 'Artwork',
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handle(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const up = await uploadToCloudinary(file);
      onChange(up.secure_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <p className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink/60">{label}</p>
      {value ? (
        <div className="relative overflow-hidden rounded-2xl ring-1 ring-ink/10">
          <img src={cloudinaryThumb(value, 800)} alt={`${label} preview`} className="aspect-[16/9] w-full object-cover" loading="lazy" />
          <div className="absolute right-2 top-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy || !isCloudinaryConfigured}
              className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold shadow hover:bg-white disabled:opacity-50"
            >
              {busy ? 'Uploading…' : 'Replace'}
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label="Remove image"
              className="rounded-full bg-red-600 p-1.5 text-white shadow"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy || !isCloudinaryConfigured}
          className="flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-ink/15 bg-paper px-4 py-8 text-sm font-semibold text-ink/60 transition hover:border-ember hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
          {busy ? 'Uploading…' : `Upload ${label.toLowerCase()}`}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => void handle(e.target.files?.[0])}
      />
      {!isCloudinaryConfigured && (
        <p className="mt-1.5 text-xs text-ink/50">Cloudinary is not configured — fill it in src/config.ts to enable uploads.</p>
      )}
      {error && <p className="mt-1.5 text-xs text-red-700">{error}</p>}
      <p className="mt-1 text-[11px] text-ink/40">Auto-compressed before upload (≤1600px WebP).</p>
    </div>
  );
}
