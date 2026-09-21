/**
 * Client-side image pre-compression — the biggest Cloudinary bandwidth win.
 * Every upload is downscaled (longest edge ≤ 1600px) and re-encoded to WebP
 * (~82% quality) BEFORE it leaves the browser, so we never pay to upload,
 * store, or deliver 12 MP phone photos. Delivery transforms (f_auto/q_auto,
 * sized widths) handle the rest — see lib/shop.ts `cloudinaryThumb`.
 */

export interface OptimizeOptions {
  /** Longest edge cap in px. No upscaling ever. Default 1600. */
  maxDim?: number;
  /** WebP/JPEG quality 0–1. Default 0.82. */
  quality?: number;
}

export interface OptimizedImage {
  blob: Blob;
  width: number;
  height: number;
  format: string;
  originalBytes: number;
  bytes: number;
  /** False when the original was already optimal (or APIs unavailable). */
  optimized: boolean;
}

/** Pure: fit inside maxDim preserving aspect ratio, never upscale. */
export function targetDimensions(
  width: number,
  height: number,
  maxDim: number
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxDim || longest <= 0) return { width, height };
  const scale = maxDim / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** Small files in a web-friendly format skip re-encoding (no pointless loss). */
export function alreadyOptimal(file: File, width: number, height: number, maxDim: number): boolean {
  const SMALL_ENOUGH = 350 * 1024;
  const WEB_FRIENDLY = file.type === 'image/webp' || file.type === 'image/jpeg';
  return WEB_FRIENDLY && file.size <= SMALL_ENOUGH && Math.max(width, height) <= maxDim;
}

export function canOptimize(): boolean {
  return (
    typeof createImageBitmap === 'function' &&
    typeof document !== 'undefined' &&
    !!document.createElement('canvas').getContext
  );
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    // WebP first (alpha-safe, ~30% smaller than JPEG); JPEG fallback.
    canvas.toBlob(
      (webp) => {
        if (webp) return resolve(webp);
        canvas.toBlob((jpg) => resolve(jpg), 'image/jpeg', quality);
      },
      'image/webp',
      quality
    );
  });
}

export async function optimizeImageFile(file: File, opts: OptimizeOptions = {}): Promise<OptimizedImage> {
  const maxDim = opts.maxDim ?? 1600;
  const quality = opts.quality ?? 0.82;
  const passthrough = (w = 0, h = 0): OptimizedImage => ({
    blob: file,
    width: w,
    height: h,
    format: file.type.replace('image/', ''),
    originalBytes: file.size,
    bytes: file.size,
    optimized: false,
  });

  if (!canOptimize()) return passthrough();
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return passthrough();
  }
  if (!bitmap) return passthrough();
  try {
    if (alreadyOptimal(file, bitmap.width, bitmap.height, maxDim)) {
      return { ...passthrough(bitmap.width, bitmap.height) };
    }
    const { width, height } = targetDimensions(bitmap.width, bitmap.height, maxDim);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return passthrough(bitmap.width, bitmap.height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await toBlob(canvas, quality);
    if (!blob || blob.size >= file.size) {
      // Re-encode didn't help (e.g. tiny icon) — keep the original.
      return passthrough(bitmap.width, bitmap.height);
    }
    return {
      blob,
      width,
      height,
      format: blob.type === 'image/webp' ? 'webp' : 'jpeg',
      originalBytes: file.size,
      bytes: blob.size,
      optimized: true,
    };
  } finally {
    if (typeof bitmap.close === 'function') bitmap.close();
  }
}

/** Human-readable bytes for admin UI hints. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
