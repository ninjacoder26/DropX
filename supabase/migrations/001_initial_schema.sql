-- DropX 2.0 — 001 initial schema
-- Run in Supabase SQL editor in order: 001, 002, 003, 004.
-- Requires pgcrypto for gen_random_uuid (enabled by default on Supabase).

create extension if not exists "pgcrypto";

-- ─── Categories ─────────────────────────────────────────────
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text default '',
  image_url text,
  parent_id uuid references public.categories(id) on delete set null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Products ───────────────────────────────────────────────
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text default '',
  category_id uuid references public.categories(id) on delete set null,
  base_price numeric(12,2) not null check (base_price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price >= 0),
  currency text not null default 'NPR',
  is_active boolean not null default true,
  is_featured boolean not null default false,
  is_trending boolean not null default false,
  is_new boolean not null default false,
  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,
  total_sold int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_active on public.products(is_active);
create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_products_trending on public.products(is_trending) where is_trending = true;

-- ─── Variants (size / color / sku / inventory) ──────────────
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,                      -- e.g. "M / Black"
  sku text not null unique,
  size text,
  color text,
  price_adjustment numeric(12,2) not null default 0,
  stock int not null default 0 check (stock >= 0),
  low_stock_threshold int not null default 5,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_variants_product on public.product_variants(product_id);

-- ─── Product images (assets live in Cloudinary) ─────────────
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  cloudinary_public_id text not null,
  secure_url text not null,
  alt_text text default '',
  width int,
  height int,
  bytes int,
  format text,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_images_product on public.product_images(product_id, sort_order);

-- ─── Profiles (1:1 with auth.users) ─────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer','admin','superadmin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Addresses ──────────────────────────────────────────────
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'Home',
  full_name text not null,
  phone text not null,
  province text not null,
  city text not null,
  street text not null,
  postal_code text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_addresses_user on public.addresses(user_id);

-- ─── Carts (persistent, one row per user+variant) ───────────
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity int not null default 1 check (quantity > 0 and quantity <= 99),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, product_id, variant_id)
);

-- ─── Orders (price snapshots preserved; totals computed server-side) ──
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','pending_verification','paid','failed','refunded')),
  payment_provider text,                   -- 'cod' | 'bank_transfer' | 'manual' | null (offline only)
  payment_ref text,
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  shipping_fee numeric(12,2) not null default 0 check (shipping_fee >= 0),
  discount_total numeric(12,2) not null default 0 check (discount_total >= 0),
  grand_total numeric(12,2) not null default 0 check (grand_total >= 0),
  currency text not null default 'NPR',
  shipping_name text not null default '',
  shipping_phone text not null default '',
  shipping_province text not null default '',
  shipping_city text not null default '',
  shipping_street text not null default '',
  shipping_postal text,
  shipping_method text not null default 'standard',
  notes text default '',
  placed_at timestamptz not null default now(),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_orders_user on public.orders(user_id, placed_at desc);
create index if not exists idx_orders_status on public.orders(status);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,              -- snapshot
  variant_name text,
  sku text,
  unit_price numeric(12,2) not null check (unit_price >= 0),  -- snapshot
  quantity int not null check (quantity > 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  image_url text
);
create index if not exists idx_order_items_order on public.order_items(order_id);

-- ─── Reviews ────────────────────────────────────────────────
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  title text default '',
  body text default '',
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique(product_id, user_id, order_id)
);
create index if not exists idx_reviews_product on public.reviews(product_id, is_approved);

-- ─── Wishlists ──────────────────────────────────────────────
create table if not exists public.wishlists (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ─── Drops (Drop of the Month + Mega Drop of the Year) ──────
create table if not exists public.drops (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('monthly','mega')),
  title text not null,
  slug text not null unique,
  description text default '',
  artwork_url text,
  theme_color text default '#F06427',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_published boolean not null default false,
  hero_label text default '',
  check (ends_at > starts_at),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.drop_products (
  drop_id uuid not null references public.drops(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order int not null default 0,
  badge text default '',
  primary key (drop_id, product_id)
);

-- ─── Admin activity log ─────────────────────────────────────
create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,                    -- e.g. 'product.update'
  entity text not null,                    -- e.g. 'products'
  entity_id text,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists idx_admin_logs_created on public.admin_logs(created_at desc);

-- ─── updated_at trigger ─────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_categories_touch on public.categories;
create trigger trg_categories_touch before update on public.categories
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_products_touch on public.products;
create trigger trg_products_touch before update on public.products
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_variants_touch on public.product_variants;
create trigger trg_variants_touch before update on public.product_variants
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_orders_touch on public.orders;
create trigger trg_orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_drops_touch on public.drops;
create trigger trg_drops_touch before update on public.drops
  for each row execute function public.touch_updated_at();
