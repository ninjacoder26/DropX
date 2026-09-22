-- DropX 2.0 — 019 plan-based delivery with per-product control
--
-- Each delivery plan has its own base fee + Rs/km rate, an on/off switch,
-- and a scope controlling WHICH products it serves:
--   'all'     → every product
--   'include' → only products listed in delivery_plan_products
--   'exclude' → every product EXCEPT those listed
-- A plan serves an order only if it covers ALL of its items.
-- place_order() is redefined here (supersedes 015) to price from plans and
-- enforce availability server-side. Instant ships paused (coming soon).

create table if not exists public.delivery_plans (
  key text primary key,
  label text not null,
  eta text not null default '',
  base_fee numeric(12,2) not null default 0 check (base_fee >= 0),
  rate_per_km numeric(12,2) not null default 10 check (rate_per_km >= 0),
  is_active boolean not null default true,
  scope text not null default 'all' check (scope in ('all', 'include', 'exclude')),
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.delivery_plan_products (
  plan_key text not null references public.delivery_plans(key) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  primary key (plan_key, product_id)
);

-- Seed from the current settings so existing custom rates survive the move.
insert into public.delivery_plans (key, label, eta, base_fee, rate_per_km, is_active, scope, sort_order)
select 'standard', 'Standard', '3–5 days', 0,
  coalesce(max(case when key = 'delivery_rate_standard' then value::numeric end), 10),
  true, 'all', 1
from public.store_settings
on conflict (key) do nothing;

insert into public.delivery_plans (key, label, eta, base_fee, rate_per_km, is_active, scope, sort_order)
select 'express', 'Express', '1–3 days', 0,
  coalesce(max(case when key = 'delivery_rate_express' then value::numeric end), 20),
  true, 'all', 2
from public.store_settings
on conflict (key) do nothing;

insert into public.delivery_plans (key, label, eta, base_fee, rate_per_km, is_active, scope, sort_order)
values ('instant', 'Instant', 'within 6 hours', 0, 30, false, 'all', 3)
on conflict (key) do nothing;

alter table public.delivery_plans enable row level security;
alter table public.delivery_plan_products enable row level security;

drop policy if exists "public read plans" on public.delivery_plans;
create policy "public read plans" on public.delivery_plans
  for select using (true);

drop policy if exists "admin manage plans" on public.delivery_plans;
create policy "admin manage plans" on public.delivery_plans
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read plan products" on public.delivery_plan_products;
create policy "public read plan products" on public.delivery_plan_products
  for select using (true);

drop policy if exists "admin manage plan products" on public.delivery_plan_products;
create policy "admin manage plan products" on public.delivery_plan_products
  for all using (public.is_admin()) with check (public.is_admin());

drop trigger if exists trg_plans_touch on public.delivery_plans;
create trigger trg_plans_touch before update on public.delivery_plans
  for each row execute function public.touch_updated_at();

-- Authoritative fee: base + km × rate. Unknown areas fall back to 10 km.
create or replace function public.delivery_fee(p_method text, p_area text)
returns numeric(12,2)
language plpgsql security definer stable
set search_path = public as $$
declare
  v_km numeric(12,2);
  v_base numeric(12,2) := 0;
  v_rate numeric(12,2) := 10;
begin
  select km into v_km from public.delivery_zones where lower(area) = lower(trim(coalesce(p_area, '')));
  if v_km is null then v_km := 10; end if;
  select base_fee, rate_per_km into v_base, v_rate
  from public.delivery_plans where key = p_method;
  if not found then
    -- Pre-019 databases: legacy flat fees, no distance component.
    if p_method = 'express' then
      select coalesce(max(case when key = 'shipping_express' then value::numeric end), 199)
        into v_rate from public.store_settings;
    else
      select coalesce(max(case when key = 'shipping_standard' then value::numeric end), 99)
        into v_rate from public.store_settings;
    end if;
    return round(v_rate);
  end if;
  return round(v_base + v_km * v_rate);
end $$;

-- Gate: the method must be active and cover every product in the order.
create or replace function public.delivery_plan_applies(p_method text, p_product_ids uuid[])
returns void
language plpgsql security definer
set search_path = public as $$
declare
  v_scope text;
  v_missing int;
begin
  select scope into v_scope from public.delivery_plans where key = p_method and is_active;
  if not found then
    raise exception 'Delivery method unavailable';
  end if;
  if v_scope = 'all' then
    return;
  end if;
  select count(*) into v_missing
  from (select distinct unnest(p_product_ids) as pid) d
  where (v_scope = 'include' and not exists (
           select 1 from public.delivery_plan_products
           where plan_key = p_method and product_id = d.pid))
     or (v_scope = 'exclude' and exists (
           select 1 from public.delivery_plan_products
           where plan_key = p_method and product_id = d.pid));
  if v_missing > 0 then
    raise exception 'Delivery method unavailable for some items in your bag';
  end if;
end $$;

-- place_order() on the plan engine (supersedes 015; same contract otherwise).
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
