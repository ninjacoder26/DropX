-- DropX 2.0 — 015 distance-based delivery from Imadol
--
-- Standard: Rs 10/km, 3–5 days (free over the configured threshold).
-- Express:  Rs 20/km, 1–3 days.
-- Instant (within 6 hours) is COMING SOON — the server rejects it.
-- Rates live in store_settings (Admin → Settings); road distances live in
-- delivery_zones (mirrored in src/lib/delivery.ts for instant UI quotes).
-- place_order() is redefined here to use the zone engine (supersedes 014).

create table if not exists public.delivery_zones (
  area text primary key,
  district text not null,
  km numeric(5,2) not null check (km >= 0)
);

insert into public.delivery_zones (area, district, km) values
  ('Thamel', 'Kathmandu', 8), ('Lazimpat', 'Kathmandu', 8.5),
  ('Baluwatar', 'Kathmandu', 9), ('Maharajgunj', 'Kathmandu', 10),
  ('Chabahil', 'Kathmandu', 8.5), ('Boudha', 'Kathmandu', 9.5),
  ('Jorpati', 'Kathmandu', 11), ('Kapan', 'Kathmandu', 12),
  ('Balaju', 'Kathmandu', 10.5), ('Gongabu', 'Kathmandu', 11.5),
  ('Kalanki', 'Kathmandu', 11), ('Kalimati', 'Kathmandu', 8.5),
  ('Tripureshwor', 'Kathmandu', 6.5), ('New Baneshwor', 'Kathmandu', 6),
  ('Koteshwor', 'Kathmandu', 4.5), ('Sinamangal', 'Kathmandu', 6.5),
  ('Gaushala', 'Kathmandu', 7.5), ('Dilli Bazaar', 'Kathmandu', 7),
  ('Putalisadak', 'Kathmandu', 7), ('Teku', 'Kathmandu', 7.5),
  ('Sitapaila', 'Kathmandu', 10), ('Swayambhu', 'Kathmandu', 9.5),
  ('Pulchowk', 'Lalitpur', 4.5), ('Jawalakhel', 'Lalitpur', 4),
  ('Lagankhel', 'Lalitpur', 3.5), ('Kupondole', 'Lalitpur', 5),
  ('Jhamsikhel', 'Lalitpur', 5), ('Sanepa', 'Lalitpur', 5.5),
  ('Nakhipot', 'Lalitpur', 6), ('Bhaisepati', 'Lalitpur', 7.5),
  ('Hattiban', 'Lalitpur', 6.5), ('Satdobato', 'Lalitpur', 3),
  ('Ekantakuna', 'Lalitpur', 4), ('Dhobighat', 'Lalitpur', 6),
  ('Mangalbazar', 'Lalitpur', 5), ('Patan Dhoka', 'Lalitpur', 4.5),
  ('Imadol', 'Lalitpur', 0.5), ('Tikathali', 'Lalitpur', 2),
  ('Gwarko', 'Lalitpur', 3), ('Harisiddhi', 'Lalitpur', 4),
  ('Khokana', 'Lalitpur', 8), ('Bungamati', 'Lalitpur', 9),
  ('Kamalbinayak', 'Bhaktapur', 9), ('Suryabinayak', 'Bhaktapur', 7.5),
  ('Thimi', 'Bhaktapur', 6.5), ('Madhyapur', 'Bhaktapur', 7),
  ('Lokanthali', 'Bhaktapur', 6), ('Gatthaghar', 'Bhaktapur', 6.5),
  ('Kaushaltar', 'Bhaktapur', 5.5), ('Balkot', 'Bhaktapur', 8),
  ('Dadhikot', 'Bhaktapur', 9.5), ('Sipadol', 'Bhaktapur', 10.5),
  ('Sallaghari', 'Bhaktapur', 8.5), ('Byasi', 'Bhaktapur', 9),
  ('Taumadhi', 'Bhaktapur', 9.5), ('Katunje', 'Bhaktapur', 10),
  ('Jhaukhel', 'Bhaktapur', 11), ('Tathali', 'Bhaktapur', 10)
on conflict (area) do nothing;

alter table public.delivery_zones enable row level security;

drop policy if exists "public read zones" on public.delivery_zones;
create policy "public read zones" on public.delivery_zones
  for select using (true);

drop policy if exists "admin manage zones" on public.delivery_zones;
create policy "admin manage zones" on public.delivery_zones
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.store_settings (key, value) values
  ('delivery_rate_standard', '10'),
  ('delivery_rate_express', '20')
on conflict (key) do nothing;

-- Authoritative per-order fee: km × rate. Unknown areas fall back to 10 km
-- rather than failing checkout.
create or replace function public.delivery_fee(p_method text, p_area text)
returns numeric(12,2)
language plpgsql security definer stable
set search_path = public as $$
declare
  v_km numeric(12,2);
  v_rate numeric(12,2);
begin
  select km into v_km from public.delivery_zones where lower(area) = lower(trim(coalesce(p_area, '')));
  if v_km is null then v_km := 10; end if;
  if p_method = 'express' then
    select coalesce(max(case when key = 'delivery_rate_express' then value::numeric end), 20)
      into v_rate from public.store_settings;
  else
    select coalesce(max(case when key = 'delivery_rate_standard' then value::numeric end), 10)
      into v_rate from public.store_settings;
  end if;
  return round(v_km * v_rate);
end $$;

-- place_order() on the zone engine (supersedes 014; same contract otherwise).
create or replace function public.place_order(
  p_items jsonb,
  p_address jsonb,
  p_shipping_method text default 'standard',
  p_notes text default '',
  p_payment_provider text default 'cod'
)
returns uuid
language plpgsql security definer
set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_order_id uuid := gen_random_uuid();
  v_order_no text;
  v_subtotal numeric(12,2) := 0;
  v_shipping numeric(12,2) := 0;
  v_total numeric(12,2);
  v_threshold numeric(12,2);
  v_city text;
  item jsonb;
  v_pid uuid; v_vid uuid; v_qty int;
  v_pname text; v_vname text; v_sku text; v_img text;
  v_unit numeric(12,2);
  v_stock int;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;
  if p_payment_provider is distinct from 'cod' then
    raise exception 'Cash on Delivery only';
  end if;
  if p_shipping_method not in ('standard', 'express') then
    raise exception 'Instant delivery is coming soon';
  end if;

  v_order_no := public.next_order_number();
  v_city := coalesce(p_address->>'city', '');

  select coalesce(max(case when key = 'free_shipping_threshold' then value::numeric end), 2999)
    into v_threshold
  from public.store_settings;

  if p_shipping_method = 'express' then
    v_shipping := public.delivery_fee('express', v_city);
  else
    v_shipping := public.delivery_fee('standard', v_city);
  end if;

  -- 1) Skeleton parent row FIRST so order_items FK checks pass.
  insert into public.orders
    (id, order_number, user_id, status, payment_status, payment_provider, subtotal, shipping_fee,
     discount_total, grand_total, currency,
     shipping_name, shipping_phone, shipping_province, shipping_city,
     shipping_street, shipping_postal, shipping_method, notes)
  values
    (v_order_id, v_order_no, v_user, 'pending', 'unpaid', p_payment_provider, 0, 0,
     0, 0, 'NPR',
     coalesce(p_address->>'full_name',''), coalesce(p_address->>'phone',''),
     coalesce(p_address->>'province',''), coalesce(p_address->>'city',''),
     coalesce(p_address->>'street',''), p_address->>'postal_code',
     p_shipping_method, coalesce(p_notes,''));

  -- 2) Snapshot items (prices re-read + locked, stock decremented).
  for item in select * from jsonb_array_elements(p_items) loop
    v_pid := (item->>'product_id')::uuid;
    v_vid := nullif(item->>'variant_id','')::uuid;
    v_qty := greatest(1, least(99, coalesce((item->>'quantity')::int, 1)));

    if v_vid is not null then
      select pv.stock, (p.base_price + pv.price_adjustment), p.name, pv.name, pv.sku
        into v_stock, v_unit, v_pname, v_vname, v_sku
      from public.product_variants pv
      join public.products p on p.id = pv.product_id
      where pv.id = v_vid and pv.product_id = v_pid
        and pv.is_active and p.is_active
      for update of pv;
      if not found then raise exception 'Invalid item: %', v_pid; end if;
      if v_stock < v_qty then
        raise exception 'Insufficient stock for % (% left)', v_pname, v_stock;
      end if;
      update public.product_variants set stock = stock - v_qty where id = v_vid;
    else
      select p.name into v_pname from public.products p where p.id = v_pid and p.is_active;
      if not found then raise exception 'Invalid item: %', v_pid; end if;
      -- Products without variants carry no separate stock row; require at least
      -- one active variant with stock OR treat as made-to-order? We enforce variants:
      raise exception 'Please select a size/variant for %', v_pname;
    end if;

    select secure_url into v_img from public.product_images
      where product_id = v_pid order by is_primary desc, sort_order asc limit 1;

    v_subtotal := v_subtotal + v_unit * v_qty;

    insert into public.order_items
      (order_id, product_id, variant_id, product_name, variant_name, sku, unit_price, quantity, line_total, image_url)
    values
      (v_order_id, v_pid, v_vid, v_pname, v_vname, v_sku, v_unit, v_qty, v_unit * v_qty, v_img);
  end loop;

  if v_subtotal >= v_threshold and p_shipping_method = 'standard' then
    v_shipping := 0;
  end if;
  v_total := v_subtotal + v_shipping;

  -- 3) Final totals on the parent row.
  update public.orders
  set subtotal = v_subtotal,
      shipping_fee = v_shipping,
      discount_total = 0,
      grand_total = v_total
  where id = v_order_id;

  -- Clear the purchased lines from the persistent cart
  delete from public.cart_items where user_id = v_user;

  return v_order_id;
end $$;
