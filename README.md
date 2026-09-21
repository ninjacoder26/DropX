# DropX 2.0 — Nepal-focused E-commerce Platform

React + TypeScript + Vite + Tailwind frontend · **Supabase** (Postgres, Auth, RLS) backend ·
**Cloudinary** product imagery · **Vercel** hosting. Brand palette: ember `#F06427`, ink `#101010`, paper `#F7F5F0`.

Offline payments only — Cash on Delivery + manual bank transfer. No online payment providers, no fake success screens.

## What is built

- **Storefront** — homepage (hero, categories, trending, new arrivals, drops), shop with search/filter/sort/price/stock filters, product detail (gallery, variants, stock states, reviews, related), cart (guest + persistent server cart), wishlist, collections, 404.
- **Signature drops** — *Drop of the Month* (`kind='monthly'`) and *Mega Drop of the Year* (`kind='mega'`), fully managed in admin (title, slug, description, artwork upload, theme, dates, curated products + badges, publish flag). The storefront only surfaces drops that are published (enabled) **and** inside their date window: live drops are shoppable, upcoming ones are teaser previews, ended ones retire to a collapsible archive. States derive from `starts_at`/`ends_at` — nothing hardcoded, no fake countdowns.
- **Auth** — email/password + Google OAuth, email verification, password recovery (`/forgot-password` → `/reset-password`), session handling, `customer` / `admin` / `superadmin` roles enforced by **RLS + server functions**, never by hidden routes alone.
- **Checkout** — addresses, shipping methods (free standard over NPR 2,999), Terms/Privacy consent gate. Totals, stock and the payment method are enforced in `place_order()` — client prices are ignored. Orders stay `unpaid` until an admin confirms cash collection or verifies a bank receipt via `mark_order_paid()`. Order snapshots preserve product names/prices.
- **Admin** (`/admin`) — sidebar dashboard with overview queues (unpaid orders, pending reviews, low stock), products + variants/inventory with thumbnail grid and **CSV import/export**, Cloudinary image manager (upload/preview/reorder/primary/delete) plus one-click artwork upload for categories and drops, categories with image tiles, orders (status workflow + verified-paid transition + search), customers (roles), drops, review moderation, analytics, **Settings** (announcement bar, support email, shipping fees/threshold — applied live, no code changes), activity logs. Every admin write is audited to `admin_logs`.
- **Uploads** — product/category/drop artwork → **Cloudinary** (validated, auto-optimized delivery with responsive `srcset`s); profile avatars → **Supabase Storage** (`dropx-assets` bucket, owner-only writes). No secrets ever touch the browser.
- **Legal & auth flow** — Terms of Service + Privacy Policy pages, consent checkbox at checkout, and login/register that return you to where you were going (`?next=/checkout`) with your guest bag merged on sign-in.
- **Quality** — responsive from phones to desktops, keyboard-accessible, lazy images with responsive `srcset`s, prioritized hero (LCP) image, split vendor bundles for long-term caching, SEO meta, error boundary + boot guard (never a blank page), reusable components, Vitest suite (`npm test`).

## Quick start

```bash
cd DropX
npm install
npm run dev                 # http://localhost:5173
```

> Do NOT open `dist/index.html` straight from the file system (`file://`) — Vite apps need a server. Use `npm run dev` (development) or `npm run build` + `npm run preview` (production build). If the page ever fails to boot, it shows an explanation instead of a blank screen.

Without backend values the app still runs fully — catalog sections show setup guidance instead of products. No fake products are ever presented as live inventory.

## 1. Client configuration (in code — `src/config.ts`)

Public, browser-safe values live directly in `src/config.ts` — no client `.env` file exists on purpose:

```ts
supabaseUrl: 'https://xyzcompany.supabase.co',
supabaseAnonKey: '…',              // anon *publishable* key — safe in the bundle
cloudinaryCloudName: '…',
cloudinaryUploadPreset: '…',       // unsigned preset scoped to dropx/products
```

The anon key is designed to be public; **Row Level Security** is what protects your data (see `supabase/migrations/002_rls.sql`). Only the server `.env` (below) holds real secrets.

## 2. Supabase setup

1. Create a project at <https://supabase.com/dashboard> (free tier is fine).
2. **SQL Editor → New query**, run in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls.sql`
   - `supabase/migrations/003_functions.sql`
   - `supabase/migrations/004_seed.sql` *(optional demo catalog)*
   - `supabase/migrations/005_storage.sql` *(avatar/file bucket + policies)*
   - `supabase/migrations/006_settings.sql` *(customizable store settings)*
3. **Authentication → Providers → Google**: enable and add your Client ID/Secret (see Google OAuth below). Add Site URL + Redirect URLs:
   - `http://localhost:5173/account`
   - `http://localhost:5173/reset-password`
   - `https://YOUR-VERCEL-URL/account`
   - `https://YOUR-VERCEL-URL/reset-password`
4. **Authentication → Email**: enable *Confirm email*.
5. Paste the Project URL + anon key into `src/config.ts`.
6. Make your first admin (SQL Editor, after signing up once):
   ```sql
   update public.profiles set role = 'superadmin' where email = 'you@example.com';
   ```

## 3. Google OAuth configuration

1. <https://console.cloud.google.com> → new project → **APIs & Services → Credentials → Create OAuth client ID** (Web application).
2. Authorized JavaScript origins: `http://localhost:5173`, `https://YOUR-SUPABASE-REF.supabase.co`, `https://YOUR-VERCEL-URL`.
3. Authorized redirect URIs: `https://YOUR-SUPABASE-REF.supabase.co/auth/v1/callback`.
4. Paste Client ID/Secret into Supabase **Auth → Providers → Google**.

## 4. Cloudinary setup

1. Create account at <https://cloudinary.com> → note your **Cloud name**.
2. **Settings → Upload → Upload presets → Add**: mode **Unsigned**, folder `dropx/products` → preset name goes in `src/config.ts`.
3. Admin uploads then work directly from the dashboard (validated: JPG/PNG/WebP/AVIF ≤ 8 MB).
4. For production hardening: verify the Supabase JWT + admin role inside `api/cloudinary-sign.ts` and switch to signed uploads; set `CLOUDINARY_API_KEY/SECRET/CLOUD_NAME` as **server-only** env vars (see §6). Deletions call `api/cloudinary-delete.ts` (server secret, never in the browser).

## 5. Payments — offline only

Cash on Delivery and manual bank transfer work end-to-end:

- **COD** — customer pays cash at the door; the courier/admin marks the order `paid` in the dashboard (reference = receipt / handover note).
- **Bank transfer** — after ordering, the team calls the customer with the store account details; the order ships once an admin verifies the receipt and marks it `paid` with the transaction reference.

There is intentionally no eSewa/Khalti/card code in this build — no credentials to leak, no redirects, no webhooks, and nothing that can pretend a payment succeeded. The `mark_order_paid()` RPC (admin/service-role only, reference required) is the single gate to `paid`.

## 6. Server environment (`.env` — secrets only)

Copy `.env.example` to `.env` locally (never commit `.env`). Only these server-side keys exist:

| Key | Used by |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | `/api/*` automation (bypasses RLS — never expose) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | signing uploads, deleting assets |

## 7. Deploy to Vercel

1. Push this folder to GitHub.
2. Vercel → **New Project** → import repo. Framework preset: **Vite**. Build: `npm run build`, Output: `dist`.
3. **Environment Variables** (Production + Preview): only the §6 server keys that you use (Cloudinary delete/sign, if enabled). Client values are already in `src/config.ts`, so preview deployments need zero client configuration.
4. `vercel.json` already handles SPA rewrites + asset caching. Preview deployments work per-PR automatically.

## 8. Testing

```bash
npm test        # vitest: drops, pricing, offline payments, security invariants
```

Covers: drop state derivation, NPR pricing/shipping math, absence of online providers, `.env.example` secret hygiene (no client vars, no secrets), checkout-never-self-marks-paid, RLS enablement, `place_order()` stock safety + payment-method recording. Auth/RLS/order flows should additionally be verified against a staging Supabase project before launch (documented, not claimed).

## Project structure

```
DropX/
├── api/                      # Vercel serverless: cloudinary-sign, cloudinary-delete
├── public/favicon.svg
├── scripts/check-env.mjs
├── src/
│   ├── App.tsx main.tsx index.css
│   ├── config.ts             # CLIENT config in code (Supabase URL+anon, Cloudinary)
│   ├── types.ts              # shared domain types + dropState()
│   ├── lib/                  # supabase, catalog API, shop helpers, cloudinary, offline payments, avatar, csv, safe storage
│   ├── store/                # AuthContext (OAuth w/ next-redirect), CartContext (guest + server cart)
│   ├── hooks/useShop.ts      # wishlist, recently-viewed
│   ├── components/           # layout, product cards (quick-add, srcsets), ui kit, ImageManager, CloudinaryUpload, ErrorBoundary
│   └── pages/                # storefront + Terms/Privacy + ResetPassword + AdminPage (sidebar, 9 sections)
├── supabase/migrations/      # 001 schema · 002 RLS · 003 functions · 004 seed · 005 storage · 006 settings
├── tests/                    # vitest suite (incl. render smoke tests + CSV)
├── vercel.json .env.example  # server secrets placeholders only — never committed values
└── README.md
```

## Security notes

- RLS on every table; customers can only read/write their own rows. Admin writes require `is_admin()`.
- `place_order()` is `SECURITY DEFINER`: validates the payment method, re-reads prices, locks variant rows (`FOR UPDATE`), checks stock, decrements atomically, snapshots prices into `order_items`, clears cart.
- `payment_status → paid` only via `mark_order_paid()` (admin/service-role + verified reference). Customers have **no UPDATE policy** on orders.
- Secrets live in the server `.env` / Vercel dashboard only. `.env.example` contains placeholders, never credentials. No `VITE_*` variables exist anywhere.

## What still needs your values

| Item | Where |
|---|---|
| Supabase URL + anon key | `src/config.ts` — §1/§2 |
| Google OAuth client | Supabase dashboard — §3 |
| Cloudinary cloud + preset | `src/config.ts` — §4 |
| Store bank account details | Share by phone on bank-transfer orders — §5 |
| Server secrets (if using `/api`) | `.env` / Vercel — §6 |

© 2026 DropX.
