export type Role = 'customer' | 'admin' | 'superadmin';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string | null;
  base_price: number;
  compare_at_price: number | null;
  currency: string;
  is_active: boolean;
  is_featured: boolean;
  is_trending: boolean;
  is_new: boolean;
  rating_avg: number;
  rating_count: number;
  total_sold: number;
  tags: string[];
  created_at: string;
  category?: Category | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  size: string | null;
  color: string | null;
  price_adjustment: number;
  stock: number;
  low_stock_threshold: number;
  is_active: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  variant_id: string | null;
  cloudinary_public_id: string;
  secure_url: string;
  alt_text: string;
  width: number | null;
  height: number | null;
  sort_order: number;
  is_primary: boolean;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: Role;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string;
  province: string;
  city: string;
  street: string;
  postal_code: string | null;
  is_default: boolean;
}

export interface CartLine {
  product: Product;
  variant: ProductVariant | null;
  quantity: number;
  unitPrice: number;
}

export type OrderStatus =
  | 'pending' | 'confirmed' | 'processing'
  | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus =
  | 'unpaid' | 'pending_verification' | 'paid' | 'failed' | 'refunded';

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_provider: string | null;
  payment_ref: string | null;
  subtotal: number;
  shipping_fee: number;
  discount_total: number;
  grand_total: number;
  currency: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_province: string;
  shipping_city: string;
  shipping_street: string;
  shipping_postal: string | null;
  shipping_method: string;
  notes: string;
  placed_at: string;
  paid_at: string | null;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  sku: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  image_url: string | null;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  order_id: string | null;
  rating: number;
  title: string;
  body: string;
  is_approved: boolean;
  created_at: string;
  author_name?: string;
}

export type DropKind = 'monthly' | 'mega';
export type DropState = 'upcoming' | 'active' | 'ended';

export interface Drop {
  id: string;
  kind: DropKind;
  title: string;
  slug: string;
  description: string;
  artwork_url: string | null;
  theme_color: string;
  starts_at: string;
  ends_at: string;
  is_published: boolean;
  hero_label: string;
  products?: (Product & { badge?: string })[];
}

/** Derived purely from dates — no invented countdowns. */
export function dropState(d: Pick<Drop, 'starts_at' | 'ends_at'>, now = new Date()): DropState {
  const s = new Date(d.starts_at).getTime();
  const e = new Date(d.ends_at).getTime();
  const t = now.getTime();
  if (t < s) return 'upcoming';
  if (t > e) return 'ended';
  return 'active';
}
