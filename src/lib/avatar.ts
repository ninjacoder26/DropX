/**
 * Profile avatars → Supabase Storage (`dropx-assets` bucket).
 * Rule of thumb: product photography → Cloudinary; user/other files → Supabase.
 */
import { supabase, isSupabaseConfigured } from './supabase';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 2 * 1024 * 1024;

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (!isSupabaseConfigured) throw new Error('Backend is not configured.');
  if (!ALLOWED.has(file.type)) throw new Error('Avatar must be a JPG, PNG or WebP image.');
  if (file.size > MAX_BYTES) throw new Error('Avatar must be under 2 MB.');
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `avatars/${userId}/avatar.${ext}`;
  const { error: upErr } = await supabase.storage
    .from('dropx-assets')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (upErr) throw new Error(upErr.message);
  const { data } = supabase.storage.from('dropx-assets').getPublicUrl(path);
  const url = `${data.publicUrl}?t=${Date.now()}`;
  const { error: dbErr } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId);
  if (dbErr) throw new Error(dbErr.message);
  return url;
}
