-- DropX 2.0 — 020 demand intelligence: events, requests, popularity
--
-- Design: ONE append-only event table (throttled client-side, ~1 row per
-- meaningful action) + product_requests with per-user dedupe. All
-- customer-facing aggregates go through SECURITY DEFINER functions that
-- expose COUNTS ONLY — no session/user data ever leaves the database.
-- Admins read raw rows for moderation and sourcing decisions.

-- ─── Raw activity events (append-only) ──────────────────────────
create table if not exists public.product_events (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete set null,
  session_id text not null,
  event text not null check (event in ('view', 'search', 'wishlist_add', 'cart_add', 'rec_click')),
  product_id uuid references public.products(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  query text,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists idx_events_type_time on public.product_events(event, created_at desc);
create index if not exists idx_events_product on public.product_events(product_id, event, created_at desc);
create index if not exists idx_events_category on public.product_events(category_id, created_at desc);
create index if not exists idx_events_session on public.product_events(session_id, created_at desc);

alter table public.product_events enable row level security;

drop policy if exists "anyone log events" on public.product_events;
create policy "anyone log events" on public.product_events
  for insert with check (user_id is null or user_id = auth.uid());

drop policy if exists "admin read events" on public.product_events;
create policy "admin read events" on public.product_events
  for select using (public.is_admin());

drop policy if exists "admin delete events" on public.product_events;
create policy "admin delete events" on public.product_events
  for delete using (public.is_admin());

-- ─── Product requests (missing-product demand) ──────────────────
create table if not exists public.product_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  session_id text not null,
  query text not null check (char_length(query) between 2 and 120),
  category_slug text,
  status text not null default 'pending'
    check (status in ('pending', 'sourced', 'rejected')),
  created_at timestamptz not null default now()
);
create index if not exists idx_requests_status on public.product_requests(status, created_at desc);
create index if not exists idx_requests_query on public.product_requests(query);

-- Dedupe: one row per customer per normalized query (client normalizes +
-- pre-checks; these indexes are the backstop, not the UX).
drop index if exists uq_requests_user_query;
create unique index uq_requests_user_query
  on public.product_requests (user_id, query) where user_id is not null;
drop index if exists uq_requests_session_query;
create unique index uq_requests_session_query
  on public.product_requests (session_id, query) where user_id is null;

alter table public.product_requests enable row level security;

drop policy if exists "anyone request products" on public.product_requests;
create policy "anyone request products" on public.product_requests
  for insert with check (user_id is null or user_id = auth.uid());

drop policy if exists "owner read own requests" on public.product_requests;
create policy "owner read own requests" on public.product_requests
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "admin moderate requests" on public.product_requests;
create policy "admin moderate requests" on public.product_requests
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin delete requests" on public.product_requests;
create policy "admin delete requests" on public.product_requests
  for delete using (public.is_admin());

-- ─── Public popularity aggregates (counts only — never who) ─────
create or replace function public.product_popularity()
returns table (
  product_id uuid,
  views_30d bigint,
  carts_30d bigint,
  wishlists_30d bigint,
  purchases_30d bigint,
  score numeric,
  conversion numeric
)
language sql security definer stable
set search_path = public as $$
  with ev as (
    select e.product_id,
      count(*) filter (where e.event = 'view')::bigint as v,
      count(*) filter (where e.event = 'cart_add')::bigint as c,
      count(*) filter (where e.event = 'wishlist_add')::bigint as w
    from public.product_events e
    where e.product_id is not null
      and e.created_at > now() - interval '30 days'
    group by e.product_id
  ),
  pur as (
    select oi.product_id, count(*)::bigint as p
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.status <> 'cancelled'
      and o.placed_at > now() - interval '30 days'
      and oi.product_id is not null
    group by oi.product_id
  )
  select p.id,
    coalesce(ev.v, 0), coalesce(ev.c, 0), coalesce(ev.w, 0), coalesce(pur.p, 0),
    (coalesce(pur.p, 0) * 10 + coalesce(ev.c, 0) * 3
      + coalesce(ev.w, 0) * 2 + coalesce(ev.v, 0))::numeric,
    case when coalesce(ev.v, 0) > 0
      then round(coalesce(pur.p, 0)::numeric / ev.v, 3)
      else 0 end
  from public.products p
  left join ev on ev.product_id = p.id
  left join pur on pur.product_id = p.id
  where p.is_active;
$$;

-- ─── Session co-views ("also viewed") — sessions only, never users ─
create or replace function public.related_by_session(p_product uuid, p_limit int default 6)
returns table (product_id uuid, sessions bigint)
language sql security definer stable
set search_path = public as $$
  select e2.product_id, count(distinct e2.session_id)::bigint as sessions
  from public.product_events e1
  join public.product_events e2
    on e1.session_id = e2.session_id
   and e2.product_id is distinct from e1.product_id
  where e1.product_id = p_product
    and e1.event = 'view'
    and e2.event = 'view'
    and e2.created_at > now() - interval '30 days'
  group by e2.product_id
  order by sessions desc
  limit greatest(1, least(12, coalesce(p_limit, 6)));
$$;
