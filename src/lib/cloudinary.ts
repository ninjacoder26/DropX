/**
 * Cloudinary integration boundary.
 * - Uploads prefer SIGNED flow (server holds CLOUDINARY_API_SECRET, verifies
 *   the admin JWT, signs per-upload params) and fall back to the UNSIGNED
 *   preset when the server endpoint is unavailable.
 * - Deletions always go through /api/cloudinary-delete.
 *   Never put API secrets in client code.
 */

import { APP_CONFIG, isCloudinaryConfigured } from '../config';
import { formatBytes, optimizeImageFile } from './image';

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

interface SignedParams {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

export function validateImageFile(file: File): string | null {
  if (!ALLOWED.has(file.type)) return 'Only JPG, PNG, WebP or AVIF images are allowed.';
  if (file.size > 8 * 1024 * 1024) return 'Image must be under 8 MB.';
  return null;
}

function toResult(json: {
  public_id: string; secure_url: string; width: number;
  height: number; bytes: number; format: string;
}): UploadResult {
  return {
    public_id: json.public_id,
    secure_url: json.secure_url,
    width: json.width,
    height: json.height,
    bytes: json.bytes,
    format: json.format,
  };
}

/** Signed upload via server-issued params. Returns null on any failure. */
async function trySignedUpload(
  blob: Blob,
  filename: string,
  accessToken: string
): Promise<UploadResult | null> {
  try {
    const signRes = await fetch('/api/cloudinary-sign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ folder: 'dropx/products' }),
    });
    if (!signRes.ok) return null;
    const signed = (await signRes.json()) as SignedParams;
    if (!signed?.signature || !signed?.apiKey) return null;
    const form = new FormData();
    form.append('file', blob, filename);
    form.append('api_key', signed.apiKey);
    form.append('timestamp', String(signed.timestamp));
    form.append('signature', signed.signature);
    form.append('folder', signed.folder);
    const upRes = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, {
      method: 'POST',
      body: form,
    });
    if (!upRes.ok) return null;
    return toResult(await upRes.json());
  } catch {
    return null;
  }
}

export async function uploadToCloudinary(file: File, accessToken?: string): Promise<UploadResult> {
  const err = validateImageFile(file);
  if (err) throw new Error(err);
  if (!cloudName || !preset) {
    throw new Error(
      'Cloudinary is not configured. Fill in cloudinaryCloudName + cloudinaryUploadPreset in src/config.ts.'
    );
  }
  // Pre-compress in-browser (≤1600px WebP): uploads finish faster and every
  // byte saved here is saved again on storage + every future delivery.
  const optimized = await optimizeImageFile(file, { maxDim: 1600, quality: 0.82 });
  if (optimized.optimized) {
    console.debug(
      `[DropX] image optimized: ${formatBytes(optimized.originalBytes)} → ${formatBytes(optimized.bytes)}`
    );
  }
  // Prefer the signed flow (no abusable unsigned surface); fall back to the
  // unsigned preset when the server endpoint isn't reachable.
  if (accessToken) {
    const signed = await trySignedUpload(optimized.blob, file.name, accessToken);
    if (signed) return signed;
  }
  const form = new FormData();
  form.append('file', optimized.blob, file.name);
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
  return toResult(await res.json());
}
