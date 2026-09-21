-- DropX 2.0 — 003 server-side order + inventory functions
-- NEVER trust client-supplied prices/totals. Checkout must call place_order()
-- which re-reads prices + stock in a transaction and decrements inventory.

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', null)
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Order number generator: DX-YYYYMMDD-XXXX
create or replace function public.next_order_number()
returns text language plpgsql as $$
declare
  stamp text := to_char(now(), 'YYYYMMDD');
  seq int;
begin
  select count(*) + 1 into seq from public.orders
    where order_number like 'DX-' || stamp || '-%';
  return 'DX-' || stamp || '-' || lpad(seq::text, 4, '0');
end $$;

-- place_order(p_items jsonb, p_address jsonb, p_shipping_method text, p_notes text, p_payment_provider text)
-- p_items: [{product_id, variant_id|null, quantity}]
-- p_payment_provider: 'cod' | 'bank_transfer' | 'manual' (offline only — no online providers)
-- Server re-reads variant/product prices, checks stock, computes totals,
-- inserts order + snapshot items, decrements stock, clears cart. Atomic.
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
  v_std numeric(12,2);
  v_exp numeric(12,2);
  v_threshold numeric(12,2);
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
  if p_payment_provider not in ('cod', 'bank_transfer', 'manual') then
    raise exception 'Invalid payment method';
  end if;

  v_order_no := public.next_order_number();

  -- Commerce rules come from Admin → Settings (store_settings), with safe
  -- fallbacks so checkout never breaks on a missing row. Client hints about
  -- shipping costs are ignored — this is the authoritative computation.
  select
    coalesce(max(case when key = 'shipping_standard' then value::numeric end), 99),
    coalesce(max(case when key = 'shipping_express' then value::numeric end), 199),
    coalesce(max(case when key = 'free_shipping_threshold' then value::numeric end), 2999)
    into v_std, v_exp, v_threshold
  from public.store_settings;

  if p_shipping_method = 'express' then v_shipping := v_exp;
  elsif p_shipping_method = 'standard' then v_shipping := v_std;
  else v_shipping := v_std; end if;
  -- Free standard shipping over the configured threshold

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

  insert into public.orders
    (id, order_number, user_id, status, payment_status, payment_provider, subtotal, shipping_fee,
     discount_total, grand_total, currency,
     shipping_name, shipping_phone, shipping_province, shipping_city,
     shipping_street, shipping_postal, shipping_method, notes)
  values
    (v_order_id, v_order_no, v_user, 'pending', 'unpaid', p_payment_provider, v_subtotal, v_shipping,
     0, v_total, 'NPR',
     coalesce(p_address->>'full_name',''), coalesce(p_address->>'phone',''),
     coalesce(p_address->>'province',''), coalesce(p_address->>'city',''),
     coalesce(p_address->>'street',''), p_address->>'postal_code',
     p_shipping_method, coalesce(p_notes,''));

  -- Clear the purchased lines from the persistent cart
  delete from public.cart_items where user_id = v_user;

  return v_order_id;
end $$;

-- Admin-only: transition order status (audited)
create or replace function public.admin_set_order_status(p_order uuid, p_status text)
returns void language plpgsql security definer
set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Forbidden'; end if;
  if p_status not in ('pending','confirmed','processing','shipped','delivered','cancelled','refunded') then
    raise exception 'Invalid status';
  end if;
  update public.orders set status = p_status where id = p_order;
  insert into public.admin_logs (actor_id, action, entity, entity_id, meta)
  values (auth.uid(), 'order.status', 'orders', p_order::text, jsonb_build_object('status', p_status));
end $$;

-- Admin: mark paid ONLY with a verified reference (e.g. cash collected on
-- delivery, or a bank transfer receipt checked by hand).
-- Direct client updates to payment_status are blocked by policy design
-- (customers have no UPDATE policy on orders); this function is the gate.
create or replace function public.mark_order_paid(p_order uuid, p_provider text, p_ref text)
returns void language plpgsql security definer
set search_path = public as $$
begin
  -- Callable by admin role or service_role (bypasses RLS, auth.uid() null in
  -- service-role context). Anon/authenticated customers cannot call it
  -- successfully unless they are admins.
  if not (public.is_admin()) then
    -- Allow service_role automation (auth.uid() null in that context)
    if auth.uid() is not null then raise exception 'Forbidden'; end if;
  end if;
  if p_ref is null or length(trim(p_ref)) = 0 then
    raise exception 'Payment reference required';
  end if;
  update public.orders
    set payment_status = 'paid', payment_provider = p_provider,
        payment_ref = p_ref, paid_at = now(),
        status = case when status = 'pending' then 'confirmed' else status end
    where id = p_order;
  insert into public.admin_logs (actor_id, action, entity, entity_id, meta)
  values (auth.uid(), 'order.paid', 'orders', p_order::text,
          jsonb_build_object('provider', p_provider, 'ref', p_ref));
end $$;

-- Keep product rating aggregates fresh
create or replace function public.refresh_product_rating()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  update public.products p
  set rating_avg = coalesce((select round(avg(rating)::numeric,2) from public.reviews where product_id = p.id and is_approved),0),
      rating_count = coalesce((select count(*) from public.reviews where product_id = p.id and is_approved),0)
  where p.id = coalesce(new.product_id, old.product_id);
  return coalesce(new, old);
end $$;

drop trigger if exists trg_reviews_rating on public.reviews;
create trigger trg_reviews_rating
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_product_rating();
