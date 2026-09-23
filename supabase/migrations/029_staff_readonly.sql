-- DropX 2.0 — 029 staff read-only dashboard access
-- Subadmins may VIEW the admin dashboard (inactive products, drafts, orders,
-- reviews, queues) but change nothing except product_images (026). Reads are
-- granted table by table below; every write policy still requires is_admin().
-- profiles, admin_logs and addresses stay private (no staff grant).

drop policy if exists "staff read categories" on public.categories;
create policy "staff read categories" on public.categories
  for select using (public.is_staff());

drop policy if exists "staff read products" on public.products;
create policy "staff read products" on public.products
  for select using (public.is_staff());

drop policy if exists "staff read variants" on public.product_variants;
create policy "staff read variants" on public.product_variants
  for select using (public.is_staff());

drop policy if exists "staff read drops" on public.drops;
create policy "staff read drops" on public.drops
  for select using (public.is_staff());

drop policy if exists "staff read drop products" on public.drop_products;
create policy "staff read drop products" on public.drop_products
  for select using (public.is_staff());

drop policy if exists "staff read orders" on public.orders;
create policy "staff read orders" on public.orders
  for select using (public.is_staff());

drop policy if exists "staff read order items" on public.order_items;
create policy "staff read order items" on public.order_items
  for select using (public.is_staff());

drop policy if exists "staff read reviews" on public.reviews;
create policy "staff read reviews" on public.reviews
  for select using (public.is_staff());

drop policy if exists "staff read events" on public.product_events;
create policy "staff read events" on public.product_events
  for select using (public.is_staff());

drop policy if exists "staff read requests" on public.product_requests;
create policy "staff read requests" on public.product_requests
  for select using (public.is_staff());

drop policy if exists "staff read image requests" on public.image_requests;
create policy "staff read image requests" on public.image_requests
  for select using (public.is_staff());

drop policy if exists "staff read request notes" on public.image_request_notes;
create policy "staff read request notes" on public.image_request_notes
  for select using (public.is_staff());
