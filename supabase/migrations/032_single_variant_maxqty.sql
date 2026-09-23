-- DropX 2.0 - 032 single variant, per-item cap, admin wishlist reads
-- 1) One variant per product: stock of removed variants rolls into the
--    keeper (most stock wins), image links follow the keeper, and products
--    with no variant get a zero-stock Standard row admins can fill in.
-- 2) Default max_qty_per_item = 3 (Admin -> Settings can change it) plus a
--    server-side clamp in place_order() so the cap holds for every client.
-- 3) Admins can read (and remove) any wishlist row for support.

-- keeper = most stock (active first); deleted variants pour stock into it
with ranked as (
  select id, product_id, stock,
    row_number() over (
      partition by product_id order by is_active desc, stock desc, created_at
    ) as rn,
    sum(stock) over (partition by product_id) as total
  from public.product_variants
)
update public.product_variants v
set stock = r.total
from ranked r
where v.id = r.id and r.rn = 1 and v.stock is distinct from r.total;

-- images of removed variants follow the keeper
with ranked as (
  select id, product_id,
    row_number() over (
      partition by product_id order by is_active desc, stock desc, created_at
    ) as rn
  from public.product_variants
),
keeper as (
  select product_id, id as keeper_id from ranked where rn = 1
),
doomed as (
  select id, product_id from ranked where rn > 1
)
update public.product_images im
set variant_id = k.keeper_id
from doomed d join keeper k on k.product_id = d.product_id
where im.variant_id = d.id;

-- drop the extra variants
with ranked as (
  select id,
    row_number() over (
      partition by product_id order by is_active desc, stock desc, created_at
    ) as rn
  from public.product_variants
)
delete from public.product_variants where id in (select id from ranked where rn > 1);

-- products with no variant get an empty Standard row (stock 0, admin fills in)
insert into public.product_variants (product_id, name, sku, stock)
select p.id, 'Standard', 'DX-AUTO-' || substr(p.id::text, 1, 8), 0
from public.products p
where not exists (select 1 from public.product_variants v where v.product_id = p.id);

-- default cap, adjustable in Admin -> Settings
insert into public.store_settings (key, value) values ('max_qty_per_item', '3')
on conflict (key) do nothing;

-- admins can see (and clean up) any wishlist for support
drop policy if exists "admin read wishlists" on public.wishlists;
create policy "admin read wishlists" on public.wishlists
  for select using (public.is_admin());

drop policy if exists "admin delete wishlists" on public.wishlists;
create policy "admin delete wishlists" on public.wishlists
  for delete using (public.is_admin());

create or replace function public.place_order(
  p_items jsonb,
  p_address jsonb,
  p_shipping_method text default 'standard',
  p_notes text default '',
  p_payment_provider text default 'cod',
  p_idempotency_key text default null
)
returns uuid
language plpgsql security definer
set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_order_id uuid := gen_random_uuid();
  v_order_no text;
  v_key text := nullif(btrim(coalesce(p_idempotency_key, '')), '');
  v_existing uuid;
  v_tries int := 0;
  v_subtotal numeric(12,2) := 0;
  v_shipping numeric(12,2) := 0;
  v_total numeric(12,2);
  v_threshold numeric(12,2);
  v_maxqty int;
  v_city text;
  v_pids uuid[] := '{}';
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
  if p_shipping_method not in ('standard', 'express', 'instant') then
    raise exception 'Unknown delivery method';
  end if;

  -- Repeat attempt with the same key: hand back the original order.
  if v_key is not null then
    select id into v_existing from public.orders
    where idempotency_key = v_key and user_id = v_user;
    if found then
      return v_existing;
    end if;
  end if;

  v_city := coalesce(p_address->>'city', '');

  select coalesce(max(case when key = 'free_shipping_threshold' then value::numeric end), 2999)
    into v_threshold
  from public.store_settings;

  -- Per-item cap, adjustable in Admin -> Settings (default 3).
  select greatest(1, least(99, coalesce(max(case when key = 'max_qty_per_item' then value::int end), 3)))
    into v_maxqty
  from public.store_settings;

  -- Every method prices from its own plan row (instant used to bill as standard).
  v_shipping := public.delivery_fee(p_shipping_method, v_city);

  -- 1) Skeleton parent row FIRST so order_items FK checks pass.
  -- Loop regenerates the order number on the rare concurrent collision;
  -- a twin attempt with the same key returns the existing order instead.
  loop
    v_order_no := public.next_order_number();
    begin
      insert into public.orders
        (id, order_number, idempotency_key, user_id, status, payment_status, payment_provider, subtotal, shipping_fee,
         discount_total, grand_total, currency,
         shipping_name, shipping_phone, shipping_province, shipping_city,
         shipping_street, shipping_postal, shipping_method, notes)
      values
        (v_order_id, v_order_no, v_key, v_user, 'pending', 'unpaid', p_payment_provider, 0, 0,
         0, 0, 'NPR',
         coalesce(p_address->>'full_name',''), coalesce(p_address->>'phone',''),
         coalesce(p_address->>'province',''), coalesce(p_address->>'city',''),
         coalesce(p_address->>'street',''), p_address->>'postal_code',
         p_shipping_method, coalesce(p_notes,''));
      exit;
    exception when unique_violation then
      if v_key is not null then
        select id into v_existing from public.orders
        where idempotency_key = v_key and user_id = v_user;
        if found then
          return v_existing;
        end if;
      end if;
      v_tries := v_tries + 1;
      if v_tries > 5 then
        raise;
      end if;
    end;
  end loop;

  -- 2) Snapshot items (prices re-read + locked, stock decremented).
  for item in select * from jsonb_array_elements(p_items) loop
    v_pid := (item->>'product_id')::uuid;
    v_vid := nullif(item->>'variant_id','')::uuid;
    v_qty := greatest(1, least(v_maxqty, coalesce((item->>'quantity')::int, 1)));

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
    v_pids := v_pids || v_pid;

    insert into public.order_items
      (order_id, product_id, variant_id, product_name, variant_name, sku, unit_price, quantity, line_total, image_url)
    values
      (v_order_id, v_pid, v_vid, v_pname, v_vname, v_sku, v_unit, v_qty, v_unit * v_qty, v_img);
  end loop;

  -- Plan must be live and cover everything in the bag (rolls back if not).
  perform public.delivery_plan_applies(p_shipping_method, v_pids);

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
