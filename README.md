# DropX 2.0 — Nepal-focused E-commerce Platform

React + TypeScript + Vite + Tailwind frontend · **Supabase** (Postgres, Auth, RLS) backend ·
**Cloudinary** product imagery · **Vercel** hosting. Brand palette: ember `#F06427`, ink `#101010`, paper `#F7F5F0`.

Offline payments only — Cash on Delivery. No online payment providers, no fake success screens.

## What is built

- **Storefront** — homepage (hero, categories, trending, new arrivals, drops), shop with search/filter/sort/price/stock filters, product detail (gallery, variants, stock states, reviews, related), cart (guest + persistent server cart), wishlist, collections, 404.
- **Signature drops** — *Drop of the Month* (`kind='monthly'`) and *Mega Drop of the Year* (`kind='mega'`), fully managed in admin (title, slug, description, artwork upload, theme, dates, curated products + badges, publish flag). The storefront only surfaces drops that are published (enabled) **and** inside their date window: live drops are shoppable, upcoming ones are teaser previews, ended ones retire to a collapsible archive. States derive from `starts_at`/`ends_at` — nothing hardcoded, no fake countdowns.
- **Auth** — email/password + Google OAuth, email verification, password recovery (`/forgot-password` → `/reset-password`), session handling, `customer` / `admin` / `superadmin` roles enforced by **RLS + server functions**, never by hidden routes alone.
- **Checkout** — addresses, shipping methods (free standard over NPR 2,999), Terms/Privacy consent gate. Totals, stock and the COD-only rule are enforced in `place_order()` — client prices are ignored. Orders stay `unpaid` until the courier collects cash, then an admin marks them `paid` via `mark_order_paid()`. Order snapshots preserve product names/prices.
- **Admin** (`/admin`) — sidebar dashboard with overview queues (unpaid orders, pending reviews, low stock), products + variants/inventory with thumbnail grid and **CSV import/export**, Cloudinary image manager (upload/preview/reorder/primary/delete) plus one-click artwork upload for categories and drops, categories with image tiles, orders (status workflow + verified-paid transition + search), customers (roles), drops, review moderation, analytics, **Settings** (announcement bar, support email, shipping fees/threshold, **profit margin with one-click repricing** (hand-priced items keep their price)), activity logs. Every admin write is audited to `admin_logs`.
- **Uploads** — product/category/drop artwork → **Cloudinary** (validated, auto-optimized delivery with responsive `srcset`s); profile avatars → **Supabase Storage** (`dropx-assets` bucket, owner-only writes). No secrets ever touch the browser.
- **Legal & auth flow** — Terms of Service + Privacy Policy pages, consent checkbox at checkout, and login/register that return you to where you were going (`?next=/checkout`) with your guest bag merged on sign-in.
- **Discovery** — fixed 24-tag vocabulary (max 3 per product, no free-text tags), tag filter chips on shop, `#tag` links on product pages, and a gradual-slope recommendation engine: your viewed tags/categories steer a "Recommended for you" shelf (max 6), always mixed with fresh trending picks so one view never hijacks it.
- **Demand intelligence** — missing-product requests with per-customer dedupe ("you're #N waiting"), throttled event tracking (views/searches/wishlists/carts/rec-clicks, session-scoped, no cross-customer exposure), an admin Demand heatmap (top searches incl. zero-result, request queue with sourcing workflow, category heat bars, sortable product heat with conversion), and reasoned 60/40 recommendations surfaced on home, product, cart, and category shelves.
- **Image rights requests** — discreet per-product report menu (brand, contact, image picker, reason), per-customer dedupe, admin Image Requests center with pending badges, realtime new-report bell, private internal notes, and temporary photo hiding (never auto-deletes products). Run `023_image_requests.sql`, then enable the table in Database → Replication for live notifications.
- **Mobile + PWA** — thumb-friendly bottom tab bar, sticky add-to-bag bar on product pages, 16px fields (no iOS auto-zoom), installable app (`manifest.webmanifest`, icons, offline service worker) with a gentle first-open install banner that auto-dismisses after 30 seconds and never nags again.
- **Maintenance mode** — Admin → Settings controls everything except brand/theme: on/off, show-once-per-session vs always-reblock, button timer (0–60s), headline/message/button copy, particles, contact line. `src/config.ts` (`maintenanceMode`) remains as an emergency force-on. `/admin` is never blocked; visitors Continue Anyway once and browse normally; `/maintenance` + footer Status link return to it.
- **Guided Valley addresses** — district → area → street picker (Kathmandu / Lalitpur / Bhaktapur, 58 areas), saved-address selection at checkout, address book with delete, scroll restoration on every route, product sharing via Web Share API.
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
   - `supabase/migrations/007_product_tags.sql` *(tags column + demo backfill)*
   - `supabase/migrations/008_catalog_seed.sql` *(generated 200-product catalog — run last)*
   - `supabase/migrations/009_sold_counters.sql` *(keeps “sold” counts in sync)*
   - `supabase/migrations/010_input_limits.sql` *(length constraints)*
   - `supabase/migrations/011_retire_demos.sql` *(removes first-draft demos)*
   - `supabase/migrations/012_restore_drops.sql` *(repairs deleted drops — rerun-safe)*
   - `supabase/migrations/013_margin.sql` *(real cost prices + default 20% margin)*
   - `supabase/migrations/014_place_order_fix.sql` *(FK-safe order flow, COD-only)*
   - `supabase/migrations/015_distance_delivery.sql` *(Imadol zones + rates + zone-priced orders)*
   - `supabase/migrations/016_brand_specs.sql` *(brand + specs columns)*
   - `supabase/migrations/017_product_specs.sql` *(generated brand/specs backfill)*
   - `supabase/migrations/018_checkout_profile.sql` *(remembered checkout details)*
   - `supabase/migrations/019_delivery_plans.sql` *(plan base fees, switches, per-product scope)*
   - `supabase/migrations/020_demand.sql` *(events, requests, popularity + co-view RPCs)*
   - `supabase/migrations/021_hardening.sql` *(RLS gaps, idempotency, rate limits, indexes)*
   - `supabase/migrations/022_custom_price.sql` *(manual selling-price override)*
   - `supabase/migrations/023_image_requests.sql` *(rights-holder reports + photo hiding — run last)*
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
4. Uploads prefer the **signed flow** (`/api/cloudinary-sign`, admin JWT verified server-side, folder-locked signatures) and fall back to the unsigned preset only when the endpoint is unreachable — lock the preset down in the dashboard (folder `dropx/products`, images only) to minimize abuse surface.
5. Set `CLOUDINARY_API_KEY/SECRET/CLOUD_NAME` as **server-only** env vars (see §7) to enable signing + deletions. Deletions call `api/cloudinary-delete.ts` (server secret, never in the browser).

**Bandwidth diet (already wired):** uploads are pre-compressed in-browser to ≤1600px WebP before leaving the device (`src/lib/image.ts`); delivery uses `f_auto` + sized widths everywhere, `q_auto:eco` for grids/tiles/thumbs and full quality only for hero/gallery views; admin tables and cart thumbs load 100–200px renditions, never full files. Belt-and-braces: in your upload preset, set an **Incoming transformation** of `w_1600,c_limit/f_auto,q_auto` so even non-dashboard uploads stay lean.

## 5. Payments — Cash on Delivery only

There is no online payment integration and no bank-transfer flow: the courier collects cash at the door and an admin marks the order `paid` in the dashboard. `place_order()` (migration `015`) rejects any other payment method server-side.

## 6. Delivery — plans, base fees, distance rates, instant soon

Each plan (standard / express / instant) has its own **base fee + Rs/km from Imadol**, an on/off switch, and a product scope (**all**, **only selected**, **all except selected**) — all in Admin → Delivery, no code. A plan serves a bag only if it covers every item (enforced server-side). Standard is Rs 10/km (3–5 days, free over NPR 2,999), express Rs 20/km (1–3 days). Instant (within 6 hours) ships paused as a coming-soon teaser until activated. Rates also live in Admin → Settings; road distances live in `delivery_zones` (migration `015`/`019`) and are mirrored in `src/lib/delivery.ts` for instant checkout quotes.

## 7. Server environment (`.env` — secrets only)

Copy `.env.example` to `.env` locally (never commit `.env`). Only these server-side keys exist:

| Key | Used by |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | `/api/*` automation (bypasses RLS — never expose) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | signing uploads, deleting assets |

## 8. Deploy to Vercel

1. Push this folder to GitHub.
2. Vercel → **New Project** → import repo. Framework preset: **Vite**. Build: `npm run build`, Output: `dist`.
3. **Environment Variables** (Production + Preview): only the §7 server keys that you use (Cloudinary delete/sign, if enabled). Client values are already in `src/config.ts`, so preview deployments need zero client configuration.
4. `vercel.json` already handles SPA rewrites + asset caching. Preview deployments work per-PR automatically.

## 9. Testing

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
├── supabase/migrations/      # 001 schema · … · 018 checkout profile · 019 plans · 020 demand · 021 hardening · 022 custom price · 023 image rights
├── tests/                    # vitest suite (incl. render smoke tests + CSV)
├── vercel.json .env.example  # server secrets placeholders only — never committed values
└── README.md
```

## Security notes

- RLS on every table; customers can only read/write their own rows. Admin writes require `is_admin()`.
- `place_order()` is `SECURITY DEFINER`: validates the payment method, re-reads prices, locks variant rows (`FOR UPDATE`), checks stock, decrements atomically, snapshots prices into `order_items`, clears cart. Customers have **no direct INSERT** on orders/items at all — every order flows through the function.
- Checkout retries are idempotent (per-visit key): a retried order returns the original instead of double-charging stock. Order numbers regenerate on the rare concurrent collision.
- `payment_status → paid` only via `mark_order_paid()` (admin/service-role + verified reference). Customers have **no UPDATE policy** on orders.
- Response headers include HSTS, `nosniff`, `DENY` framing, and a tight CSP (see `vercel.json`). Event/request writes are per-session rate-limited in the database.
- Secrets live in the server `.env` / Vercel dashboard only. `.env.example` contains placeholders, never credentials. No `VITE_*` variables exist anywhere.

## What still needs your values

| Item | Where |
|---|---|
| Supabase URL + anon key | `src/config.ts` — §1/§2 |
| Google OAuth client | Supabase dashboard — §3 |
| Cloudinary cloud + preset | `src/config.ts` — §4 |
| Server secrets (if using `/api`) | `.env` / Vercel — §7 |

© 2026 DropX.
