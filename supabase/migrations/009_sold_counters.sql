-- DropX 2.0 — 009 sold counters
-- place_order() decrements stock but never incremented products.total_sold,
-- so "popular" sorting and "X sold" labels stayed frozen. This trigger keeps
-- the counter in sync on every order item insert (server-side, auditable).

create or replace function public.bump_total_sold()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  if new.product_id is not null then
    update public.products
    set total_sold = total_sold + new.quantity
    where id = new.product_id;
  end if;
  return new;
end $$;

drop trigger if exists trg_items_sold on public.order_items;
create trigger trg_items_sold
  after insert on public.order_items
  for each row execute function public.bump_total_sold();
