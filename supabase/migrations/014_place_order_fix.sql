-- DropX 2.0 — 014 place_order FK fix (supersedes the 003 version)
--
-- BUGFIX: the original inserted order_items BEFORE the parent orders row,
-- which violates order_items_order_id_fkey (foreign keys are checked per
-- statement unless deferred). Fixed flow:
--   1) insert a zero-total skeleton order (parent exists from here on)
--   2) insert order_items (FK satisfied)
--   3) update the order with final totals
--
-- Also: Cash on Delivery is the store's only checkout method — enforced here
-- so no client can place an order under any other method.
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
  if p_payment_provider is distinct from 'cod' then
    raise exception 'Cash on Delivery only';
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
