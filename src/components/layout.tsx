import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Home, LayoutGrid, Menu, Search, ShoppingBag, User, X, Zap } from 'lucide-react';
import { useCart } from '../store/CartContext';
import { useAuth } from '../store/AuthContext';
import { useStoreSettings } from '../lib/settings';

const links = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/drops', label: 'Drops' },
  { to: '/collections', label: 'Collections' },
];

export function Navbar() {
  const { count } = useCart();
  const { user, isAdmin, profile } = useAuth();
  const { announcement } = useStoreSettings();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const nav = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 backdrop-blur">
      {/* announcement */}
      <div className="bg-ink text-paper">
        <p className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]">
          <Zap size={12} className="text-ember" />
          {announcement}
        </p>
      </div>
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <button className="rounded-lg p-2 hover:bg-ink/5 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink font-display text-sm font-black text-paper">
            D<span className="text-ember">X</span>
          </span>
          <span className="font-display text-xl font-black tracking-tight">
            Drop<span className="text-ember">X</span>
          </span>
        </Link>
        <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Primary">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold ${isActive ? 'bg-ink text-paper' : 'text-ink/70 hover:bg-ink/5 hover:text-ink'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              className="rounded-full bg-ember/10 px-4 py-2 text-sm font-semibold text-ember hover:bg-ember/20"
            >
              Admin
            </NavLink>
          )}
        </nav>
        <form
          className="ml-auto hidden min-w-0 flex-1 max-w-xs items-center md:flex"
          onSubmit={(e) => {
            e.preventDefault();
            nav(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : '/shop');
          }}
          role="search"
        >
          <div className="relative w-full">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search hoodies, sneakers…"
              className="w-full rounded-full border border-ink/15 bg-white py-2 pl-9 pr-4 text-sm focus:border-ember focus:outline-none"
              aria-label="Search products"
            />
          </div>
        </form>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Link to="/wishlist" className="rounded-full p-2.5 hover:bg-ink/5" aria-label="Wishlist">
            <Heart size={19} />
          </Link>
          <Link to={user ? '/account' : '/login'} className="rounded-full p-1.5 hover:bg-ink/5" aria-label="Account">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Account" className="h-7 w-7 rounded-full object-cover ring-1 ring-ink/15" />
            ) : (
              <span className="block p-1"><User size={19} /></span>
            )}
          </Link>
          <Link
            to="/cart"
            className="relative rounded-full bg-ink p-2.5 text-paper hover:bg-ink-soft"
            aria-label={`Cart, ${count} items`}
          >
            <ShoppingBag size={19} />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-ember px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
      {open && (
        <nav className="border-t border-ink/10 bg-paper px-4 py-3 lg:hidden" aria-label="Mobile">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-2.5 text-sm font-semibold ${isActive ? 'bg-ink text-paper' : 'hover:bg-ink/5'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setOpen(false);
                nav(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : '/shop');
              }}
            >
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products…"
                className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm"
                aria-label="Search products"
              />
            </form>
          </div>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  const { supportEmail } = useStoreSettings();
  return (
    <footer className="mt-16 bg-ink text-paper">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <p className="font-display text-2xl font-black">
            Drop<span className="text-ember">X</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-paper/60">
            Nepal-focused premium streetwear & lifestyle. Designed in Kathmandu,
            delivered across the country — cash on delivery, no fuss.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-paper/5 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-paper/60 ring-1 ring-paper/10">
            <span className="h-1.5 w-1.5 rounded-full bg-ember" /> All prices in NPR
          </p>
        </div>
        <nav aria-label="Shop">
          <p className="text-xs font-bold uppercase tracking-widest text-paper/50">Shop</p>
          <ul className="mt-3 space-y-2.5 text-sm">
            <li><Link className="text-paper/80 transition hover:text-ember" to="/shop">All products</Link></li>
            <li><Link className="text-paper/80 transition hover:text-ember" to="/drops">Drop of the Month</Link></li>
            <li><Link className="text-paper/80 transition hover:text-ember" to="/drops">Mega Drop of the Year</Link></li>
            <li><Link className="text-paper/80 transition hover:text-ember" to="/collections">Collections</Link></li>
          </ul>
        </nav>
        <nav aria-label="Account">
          <p className="text-xs font-bold uppercase tracking-widest text-paper/50">Account</p>
          <ul className="mt-3 space-y-2.5 text-sm">
            <li><Link className="text-paper/80 transition hover:text-ember" to="/account">My account</Link></li>
            <li><Link className="text-paper/80 transition hover:text-ember" to="/orders">Order history</Link></li>
            <li><Link className="text-paper/80 transition hover:text-ember" to="/wishlist">Wishlist</Link></li>
            <li><Link className="text-paper/80 transition hover:text-ember" to="/cart">Bag</Link></li>
          </ul>
        </nav>
        <nav aria-label="Support and legal">
          <p className="text-xs font-bold uppercase tracking-widest text-paper/50">Support</p>
          <ul className="mt-3 space-y-2.5 text-sm">
            <li className="text-paper/80">Kathmandu Valley delivery (1–3 days)</li>
            <li className="text-paper/80">COD · Bank transfer</li>
            <li className="text-paper/80">7-day size exchanges</li>
            <li className="text-paper/80">{supportEmail}</li>
            <li className="flex gap-4 pt-1 font-bold">
              <Link className="text-paper/80 transition hover:text-ember" to="/terms">Terms</Link>
              <Link className="text-paper/80 transition hover:text-ember" to="/privacy">Privacy</Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-paper/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-4 text-xs text-paper/50 sm:px-6 lg:px-8">
          <p>© 2026 DropX. All rights reserved.</p>
          <p className="ml-auto">Prices include taxes where applicable.</p>
        </div>
      </div>
    </footer>
  );
}

/** Thumb-friendly bottom tab bar for phones/tablets. Hidden on desktop and in admin. */
export function MobileNav() {
  const { count } = useCart();
  const { user } = useAuth();
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin')) return null;

  const tabs = [
    { to: '/', label: 'Home', icon: Home, match: (p: string) => p === '/' },
    { to: '/shop', label: 'Shop', icon: LayoutGrid, match: (p: string) => p.startsWith('/shop') || p.startsWith('/product') },
    { to: '/drops', label: 'Drops', icon: Zap, match: (p: string) => p.startsWith('/drops') },
    { to: '/cart', label: 'Bag', icon: ShoppingBag, match: (p: string) => p.startsWith('/cart') || p.startsWith('/checkout'), badge: count },
    { to: user ? '/account' : '/login', label: 'Account', icon: User, match: (p: string) => ['/account', '/login', '/register', '/orders', '/wishlist'].some((s) => p.startsWith(s)) },
  ];

  return (
    <nav aria-label="Mobile" className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white/95 backdrop-blur lg:hidden">
      <div className="grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((t) => {
          const active = t.match(pathname);
          return (
            <NavLink
              key={t.label}
              to={t.to}
              aria-current={active ? 'page' : undefined}
              className={`relative flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition ${
                active ? 'text-ember' : 'text-ink/50 hover:text-ink'
              }`}
            >
              <t.icon size={20} />
              {t.label}
              {!!t.badge && t.badge > 0 && (
                <span className="absolute right-1/2 top-1 flex h-4 min-w-4 translate-x-4 items-center justify-center rounded-full bg-ember px-1 text-[9px] font-bold text-white">
                  {t.badge > 99 ? '99+' : t.badge}
                </span>
              )}
              {active && <span className="absolute bottom-1 h-1 w-8 rounded-full bg-ember" aria-hidden />}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export function SetupNotice({ area }: { area: string }) {
  return (
    <div className="rounded-2xl border border-ember/30 bg-ember/5 px-5 py-4 text-sm">
      <p className="font-bold text-ink">Backend not connected — {area} is in preview mode</p>
      <p className="mt-1 text-ink/70">
        Fill in <code className="rounded bg-ink/5 px-1">supabaseUrl</code> and{' '}
        <code className="rounded bg-ink/5 px-1">supabaseAnonKey</code> in{' '}
        <code className="rounded bg-ink/5 px-1">src/config.ts</code>, then run the SQL in{' '}
        <code className="rounded bg-ink/5 px-1">supabase/migrations</code>. See README for the full setup guide.
      </p>
    </div>
  );
}
