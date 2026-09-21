-- DropX 2.0 — 002 Row Level Security
-- Backend enforcement: frontend route-hiding is NOT sufficient; these policies are the real gate.

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlists enable row level security;
alter table public.drops enable row level security;
alter table public.drop_products enable row level security;
alter table public.admin_logs enable row level security;

-- Helper: is the caller an admin? (reads own profile row; SECURITY DEFINER to avoid recursion)
create or replace function public.is_admin()
returns boolean
language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin','superadmin')
  );
$$;

-- ─── Public catalog (read active rows anonymously) ──────────
create policy "public read active categories" on public.categories
  for select using (is_active = true or public.is_admin());
create policy "admin manage categories" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy "public read active products" on public.products
  for select using (is_active = true or public.is_admin());
create policy "admin manage products" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

create policy "public read active variants" on public.product_variants
  for select using (is_active = true or public.is_admin());
create policy "admin manage variants" on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

create policy "public read images" on public.product_images
  for select using (true);
create policy "admin manage images" on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

-- ─── Drops ──────────────────────────────────────────────────
-- Anonymous users see only published drops; admins see all.
create policy "public read published drops" on public.drops
  for select using (is_published = true or public.is_admin());
create policy "admin manage drops" on public.drops
  for all using (public.is_admin()) with check (public.is_admin());

create policy "public read drop products of published drops" on public.drop_products
  for select using (
    exists (select 1 from public.drops d where d.id = drop_id and (d.is_published = true or public.is_admin()))
  );
create policy "admin manage drop products" on public.drop_products
  for all using (public.is_admin()) with check (public.is_admin());

-- ─── Profiles ───────────────────────────────────────────────
create policy "users read own profile, admins read all" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "users update own profile (not role)" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
create policy "users insert own profile" on public.profiles
  for insert with check (id = auth.uid());
create policy "admin manage profiles" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ─── Addresses / cart / wishlist (owner-only) ───────────────
create policy "owner manage addresses" on public.addresses
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "owner manage cart" on public.cart_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "owner manage wishlist" on public.wishlists
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─── Orders ─────────────────────────────────────────────────
-- Customers read/insert their own orders only. Status/payment transitions are
-- performed via SECURITY DEFINER server functions (004), never by direct update
-- of totals from the client.
create policy "owner read own orders" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
create policy "owner insert own orders" on public.orders
  for insert with check (user_id = auth.uid());
create policy "admin manage orders" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());
-- No direct delete for customers.

create policy "owner read own order items" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
  );
create policy "owner insert own order items" on public.order_items
  for insert with check (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy "admin manage order items" on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

-- ─── Reviews ────────────────────────────────────────────────
create policy "public read approved reviews" on public.reviews
  for select using (is_approved = true or user_id = auth.uid() or public.is_admin());
create policy "users insert own reviews" on public.reviews
  for insert with check (user_id = auth.uid());
create policy "users update own unapproved reviews" on public.reviews
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy "admin moderate reviews" on public.reviews
  for delete using (public.is_admin());

-- ─── Admin logs (append-only for admins) ────────────────────
create policy "admin read logs" on public.admin_logs
  for select using (public.is_admin());
create policy "admin insert logs" on public.admin_logs
  for insert with check (public.is_admin());
