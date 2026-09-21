/**
 * Cloudinary integration boundary.
 * - Browser uploads use an UNSIGNED upload preset (no secret in client).
 * - Signed uploads / deletions go through /api/cloudinary-sign + /api/cloudinary-delete
 *   (the server holds CLOUDINARY_API_SECRET from the server-only `.env`).
 *   Never put API secrets in client code.
 */

import { APP_CONFIG, isCloudinaryConfigured } from '../config';

export { isCloudinaryConfigured };

const cloudName = APP_CONFIG.cloudinaryCloudName;
const preset = APP_CONFIG.cloudinaryUploadPreset;

export interface UploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
}

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

export function validateImageFile(file: File): string | null {
  if (!ALLOWED.has(file.type)) return 'Only JPG, PNG, WebP or AVIF images are allowed.';
  if (file.size > 8 * 1024 * 1024) return 'Image must be under 8 MB.';
  return null;
}

export async function uploadToCloudinary(file: File): Promise<UploadResult> {
  const err = validateImageFile(file);
  if (err) throw new Error(err);
  if (!cloudName || !preset) {
    throw new Error(
      'Cloudinary is not configured. Fill in cloudinaryCloudName + cloudinaryUploadPreset in src/config.ts.'
    );
  }
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', preset);
  form.append('folder', 'dropx/products');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Cloudinary upload failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  return {
    public_id: json.public_id,
    secure_url: json.secure_url,
    width: json.width,
    height: json.height,
    bytes: json.bytes,
    format: json.format,
  };
}

/** Ask the server to sign params for a signed upload (preferred for production). */
export async function getSignedParams(folder = 'dropx/products'): Promise<{
  signature: string; timestamp: number; apiKey: string; cloudName: string; folder: string;
} | null> {
  try {
    const res = await fetch('/api/cloudinary-sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
