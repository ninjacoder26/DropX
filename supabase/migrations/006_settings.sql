-- DropX 2.0 — 006 store settings (fully customizable storefront copy + commerce rules)
-- Key/value settings editable from Admin → Settings. Checkout pricing
-- (place_order in 003) reads the shipping rows from here, so the whole
-- store can be reconfigured without editing source code.

create table if not exists public.store_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into public.store_settings (key, value) values
  ('announcement', 'Free standard shipping over NPR 2,999'),
  ('support_email', 'dropx.nepal@gmail.com'),
  ('free_shipping_threshold', '2999'),
  ('shipping_standard', '99'),
  ('shipping_express', '199')
on conflict (key) do nothing;

alter table public.store_settings enable row level security;

drop policy if exists "public read settings" on public.store_settings;
create policy "public read settings" on public.store_settings
  for select using (true);

drop policy if exists "admin manage settings" on public.store_settings;
create policy "admin manage settings" on public.store_settings
  for all using (public.is_admin()) with check (public.is_admin());

drop trigger if exists trg_settings_touch on public.store_settings;
create trigger trg_settings_touch before update on public.store_settings
  for each row execute function public.touch_updated_at();
