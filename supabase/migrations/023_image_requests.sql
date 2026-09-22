-- DropX 2.0 — 023 brand image removal requests
--
-- Rights holders can dispute a product image (ownership/copyright). Requests
-- NEVER auto-delete products or images: an admin reviews, resolves/rejects,
-- and may temporarily hide the disputed image (product_images.is_hidden).
-- Claimant contact details are admin-only (separate notes table + RLS).

alter table public.product_images
  add column if not exists is_hidden boolean not null default false;

create table if not exists public.image_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  session_id text not null,
  brand_name text not null check (char_length(brand_name) between 2 and 120),
  contact_email text not null check (contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null check (char_length(image_url) between 10 and 2000),
  product_url text not null default '' check (char_length(product_url) <= 500),
  reason text not null check (char_length(reason) between 10 and 2000),
  status text not null default 'pending'
    check (status in ('pending', 'reviewed', 'resolved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_image_requests_status on public.image_requests(status, created_at desc);
create index if not exists idx_image_requests_product on public.image_requests(product_id);

-- One live request per customer per image (client pre-checks; this is the backstop).
drop index if exists uq_image_requests_user_image;
create unique index uq_image_requests_user_image
  on public.image_requests (user_id, product_id, image_url)
  where user_id is not null and status = 'pending';
drop index if exists uq_image_requests_session_image;
create unique index uq_image_requests_session_image
  on public.image_requests (session_id, product_id, image_url)
  where user_id is null and status = 'pending';

-- Internal admin notes (never visible to customers).
create table if not exists public.image_request_notes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.image_requests(id) on delete cascade,
  admin_id uuid references public.profiles(id) on delete set null,
  note text not null check (char_length(note) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists idx_image_request_notes_req on public.image_request_notes(request_id, created_at);

alter table public.image_requests enable row level security;
alter table public.image_request_notes enable row level security;

drop policy if exists "anyone file image requests" on public.image_requests;
create policy "anyone file image requests" on public.image_requests
  for insert with check (user_id is null or user_id = auth.uid());

drop policy if exists "owner read own image requests" on public.image_requests;
create policy "owner read own image requests" on public.image_requests
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "admin moderate image requests" on public.image_requests;
create policy "admin moderate image requests" on public.image_requests
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin delete image requests" on public.image_requests;
create policy "admin delete image requests" on public.image_requests
  for delete using (public.is_admin());

drop policy if exists "admin manage request notes" on public.image_request_notes;
create policy "admin manage request notes" on public.image_request_notes
  for all using (public.is_admin()) with check (public.is_admin());

-- Abuse guard: max 10 image reports per session per hour.
create or replace function public.check_image_request_rate()
returns trigger language plpgsql security definer
set search_path = public as $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.image_requests
  where session_id = NEW.session_id
    and created_at > now() - interval '1 hour';
  if v_count > 10 then
    raise exception 'Rate limit exceeded';
  end if;
  return NEW;
end $$;

drop trigger if exists trg_image_requests_rate on public.image_requests;
create trigger trg_image_requests_rate before insert on public.image_requests
  for each row execute function public.check_image_request_rate();

drop trigger if exists trg_image_requests_touch on public.image_requests;
create trigger trg_image_requests_touch before update on public.image_requests
  for each row execute function public.touch_updated_at();
