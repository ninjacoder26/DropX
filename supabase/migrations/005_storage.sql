-- DropX 2.0 — 005 Supabase Storage for non-image uploads
-- Rule: product photography → Cloudinary. Everything else that needs a file
-- (profile avatars, misc attachments) → this Supabase Storage bucket.

insert into storage.buckets (id, name, public)
values ('dropx-assets', 'dropx-assets', true)
on conflict (id) do nothing;

-- Public read (avatars are displayed in reviews / account pages)
drop policy if exists "public read dropx assets" on storage.objects;
create policy "public read dropx assets" on storage.objects
  for select using (bucket_id = 'dropx-assets');

-- Any signed-in user may upload/replace their OWN avatar at avatars/<uid>.*
drop policy if exists "users upload own avatar" on storage.objects;
create policy "users upload own avatar" on storage.objects
  for insert with check (
    bucket_id = 'dropx-assets'
    and (storage.foldername(name))[1] = 'avatars'
    and name like 'avatars/' || auth.uid()::text || '%'
  );

drop policy if exists "users update own avatar" on storage.objects;
create policy "users update own avatar" on storage.objects
  for update using (
    bucket_id = 'dropx-assets'
    and (storage.foldername(name))[1] = 'avatars'
    and name like 'avatars/' || auth.uid()::text || '%'
  ) with check (
    bucket_id = 'dropx-assets'
    and (storage.foldername(name))[1] = 'avatars'
    and name like 'avatars/' || auth.uid()::text || '%'
  );

drop policy if exists "users delete own avatar" on storage.objects;
create policy "users delete own avatar" on storage.objects
  for delete using (
    bucket_id = 'dropx-assets'
    and (storage.foldername(name))[1] = 'avatars'
    and name like 'avatars/' || auth.uid()::text || '%'
  );

-- Admins manage everything in the bucket
drop policy if exists "admin manage dropx assets" on storage.objects;
create policy "admin manage dropx assets" on storage.objects
  for all using (
    bucket_id = 'dropx-assets' and public.is_admin()
  ) with check (
    bucket_id = 'dropx-assets' and public.is_admin()
  );
