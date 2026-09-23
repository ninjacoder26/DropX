-- DropX 2.0 — 028 order cancellation with reasons + 7-day purge
-- Customers cancel their own PENDING orders; admins cancel anything not yet
-- delivered; every cancellation records who + why. Cancelling restocks the
-- reserved variant quantities. Cancelled and delivered orders older than 7
-- days are hard-deleted by purge_old_orders() (order_items cascade, reviews
-- keep their rows with order_id nulled).

alter table public.orders
  add column if not exists cancel_reason text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by text,
  add column if not exists delivered_at timestamptz;

-- Backfill timestamps for orders already in a terminal state.
update public.orders
set delivered_at = coalesce(updated_at, placed_at)
where status = 'delivered' and delivered_at is null;

update public.orders
set cancelled_at = coalesce(updated_at, placed_at),
    cancelled_by = coalesce(cancelled_by, 'admin')
where status = 'cancelled' and cancelled_at is null;

-- Cancel one order with a mandatory reason. Owners may cancel their own
-- PENDING orders only; admins may cancel anything except delivered,
-- cancelled or refunded ones. Stock reserved by place_order is returned.
create or replace function public.cancel_order(p_order uuid, p_reason text)
returns void
language plpgsql security definer
set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_owner uuid;
  v_status text;
  v_is_admin boolean;
  v_reason text := btrim(coalesce(p_reason, ''));
  item record;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;
  if v_reason = '' then
    raise exception 'A cancellation reason is required';
  end if;
  if char_length(v_reason) > 500 then
    raise exception 'Reason must be under 500 characters';
  end if;
  select user_id, status into v_owner, v_status
  from public.orders where id = p_order;
  if not found then
    raise exception 'Order not found';
  end if;
  v_is_admin := public.is_admin();
  if v_is_admin then
    if v_status in ('delivered', 'cancelled', 'refunded') then
      raise exception 'Order can no longer be cancelled';
    end if;
  else
    if v_owner is distinct from v_user then
      raise exception 'Order not found';
    end if;
    if v_status != 'pending' then
      raise exception 'Only pending orders can be cancelled';
    end if;
  end if;
  for item in
    select variant_id, quantity from public.order_items
    where order_id = p_order and variant_id is not null
  loop
    update public.product_variants
    set stock = stock + item.quantity
    where id = item.variant_id;
  end loop;
  update public.orders
  set status = 'cancelled',
      cancel_reason = v_reason,
      cancelled_at = now(),
      cancelled_by = case when v_is_admin then 'admin' else 'customer' end
  where id = p_order;
  insert into public.admin_logs (actor_id, action, entity, entity_id, meta)
  values (v_user, 'order.cancel', 'orders', p_order::text,
          jsonb_build_object('reason', v_reason,
                             'by', case when v_is_admin then 'admin' else 'customer' end));
end $$;

-- Bulk-cancel every pre-shipment order (pending + confirmed) with one
-- reason — e.g. closing for maintenance or a stock outage. Returns how many
-- were cancelled. Admin-only.
create or replace function public.admin_cancel_all(p_reason text)
returns int
language plpgsql security definer
set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_reason text := btrim(coalesce(p_reason, ''));
  v_id uuid;
  v_count int := 0;
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;
  if v_reason = '' then
    raise exception 'A cancellation reason is required';
  end if;
  if char_length(v_reason) > 500 then
    raise exception 'Reason must be under 500 characters';
  end if;
  for v_id in
    select id from public.orders
    where status in ('pending', 'confirmed')
    order by placed_at
  loop
    -- Reuse the single-order path so restock + audit stay identical.
    -- cancel_order re-checks is_admin() per row (same caller, still admin).
    perform public.cancel_order(v_id, v_reason);
    v_count := v_count + 1;
  end loop;
  insert into public.admin_logs (actor_id, action, entity, entity_id, meta)
  values (v_user, 'order.cancel_all', 'orders', null,
          jsonb_build_object('reason', v_reason, 'count', v_count));
  return v_count;
end $$;

-- Hard-delete cancelled + delivered orders older than 7 days (by their
-- terminal timestamps, not creation). order_items cascade; reviews keep
-- rows with order_id nulled. Admin-only; returns rows deleted.
create or replace function public.purge_old_orders()
returns int
language plpgsql security definer
set search_path = public as $$
declare
  v_count int;
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;
  delete from public.orders
  where (status = 'cancelled' and cancelled_at < now() - interval '7 days')
     or (status = 'delivered' and delivered_at < now() - interval '7 days');
  get diagnostics v_count = row_count;
  insert into public.admin_logs (actor_id, action, entity, entity_id, meta)
  values (auth.uid(), 'order.purge', 'orders', null,
          jsonb_build_object('deleted', v_count));
  return v_count;
end $$;

-- Stamp delivered_at through the normal status flow too (admin dropdown),
-- and route 'cancelled' through cancel_order so a reason is always kept.
create or replace function public.admin_set_order_status(p_order uuid, p_status text)
returns void language plpgsql security definer
set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Forbidden'; end if;
  if p_status not in ('pending','confirmed','processing','shipped','delivered','cancelled','refunded') then
    raise exception 'Invalid status';
  end if;
  if p_status = 'cancelled' then
    raise exception 'Use the cancel flow with a reason instead';
  end if;
  update public.orders
  set status = p_status,
      delivered_at = case when p_status = 'delivered' then now() else delivered_at end
  where id = p_order;
  insert into public.admin_logs (actor_id, action, entity, entity_id, meta)
  values (auth.uid(), 'order.status', 'orders', p_order::text, jsonb_build_object('status', p_status));
end $$;
