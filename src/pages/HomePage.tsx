import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Sparkles, Truck, ShieldCheck, RefreshCcw } from 'lucide-react';
import { fetchCategories, fetchDrops, fetchProducts } from '../lib/catalog';
import { isSupabaseConfigured } from '../lib/supabase';
import type { Category, Drop, Product } from '../types';
import { dropState } from '../types';
import { ProductGrid } from '../components/product';
import { Badge, Skeleton } from '../components/ui';
import { SetupNotice } from '../components/layout';

export default function HomePage() {
  const [trending, setTrending] = useState<Product[]>([]);
  const [fresh, setFresh] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [t, n, c, d] = await Promise.all([
          fetchProducts({ trending: true, limit: 8 }),
          fetchProducts({ isNew: true, limit: 8 }),
          fetchCategories(),
          fetchDrops(),
        ]);
        setTrending(t);
        setFresh(n);
        setCats(c);
        setDrops(d);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load storefront.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const monthly = drops.find((d) => d.kind === 'monthly');
  const mega = drops.find((d) => d.kind === 'mega');

  return (
    <div>
      {/* ── Hero ── */}
      <section className="bg-ink text-paper">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:grid-cols-2 md:py-20">
          <div className="reveal flex flex-col justify-center">
            <Badge>New season · Nepal</Badge>
            <h1 className="mt-4 font-display text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl md:text-6xl">
              Wear the
              <br />
              <span className="text-ember">Drop.</span>
            </h1>
            <p className="mt-4 max-w-md text-paper/70">
              Heavyweight streetwear designed in Kathmandu. Monthly drops, one Mega Drop a year —
              delivered to your doorstep anywhere in Nepal.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/shop" className="inline-flex items-center gap-2 rounded-full bg-ember px-6 py-3 text-sm font-bold text-white hover:bg-ember-dark">
                Shop the collection <ArrowRight size={16} />
              </Link>
              <Link to="/drops" className="inline-flex items-center gap-2 rounded-full border border-paper/25 px-6 py-3 text-sm font-bold hover:border-paper/60">
                Explore drops
              </Link>
            </div>
            <div className="mt-8 flex gap-6 text-xs text-paper/60">
              <span className="flex items-center gap-1.5"><Truck size={14} /> Nationwide delivery</span>
              <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> Verified payments</span>
              <span className="flex items-center gap-1.5"><RefreshCcw size={14} /> 7-day exchange</span>
            </div>
          </div>
          <div className="reveal reveal-1 relative overflow-hidden rounded-3xl bg-ink-soft ring-1 ring-paper/10">
            <div className="grid h-full grid-cols-2">
              <div className="flex flex-col justify-between bg-ember p-6 text-white">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em]">Drop of the month</p>
                <div>
                  <p className="font-display text-2xl font-black leading-tight">{monthly?.title ?? 'Fresh edit loading…'}</p>
                  <Link to={monthly ? `/drops/${monthly.slug}` : '/drops'} className="mt-3 inline-flex items-center gap-1 text-sm font-bold underline underline-offset-4">
                    Shop the drop <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
              <div className="flex flex-col justify-between p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ember">Mega drop of the year</p>
                <div>
                  <p className="font-display text-2xl font-black leading-tight">{mega?.title ?? 'Coming soon'}</p>
                  <p className="mt-1 text-xs text-paper/60">
                    {mega ? dropState(mega) === 'upcoming' ? 'Upcoming — watch this space' : dropState(mega) === 'active' ? 'Live now' : 'Ended' : ''}
                  </p>
                  <Link to={mega ? `/drops/${mega.slug}` : '/drops'} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-ember underline underline-offset-4">
                    View mega drop <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4">
        {!isSupabaseConfigured && (
          <div className="mt-6"><SetupNotice area="homepage catalog" /></div>
        )}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">{error}</div>
        )}

        {/* ── Categories ── */}
        <section className="mt-12">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-black tracking-tight">Shop by category</h2>
            <Link to="/shop" className="text-sm font-bold text-ember hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36" />)}
            </div>
          ) : cats.length === 0 ? (
            <p className="mt-5 text-sm text-ink/60">No categories yet — add them in the admin dashboard.</p>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {cats.map((c) => (
                <Link
                  key={c.id}
                  to={`/shop?category=${c.slug}`}
                  className="group rounded-2xl bg-ink p-5 text-paper transition hover:-translate-y-0.5"
                >
                  <p className="font-display text-lg font-extrabold group-hover:text-ember">{c.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-paper/60">{c.description}</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-ember">
                    Shop now <ArrowRight size={13} />
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Trending ── */}
        <section className="mt-14">
          <div className="flex items-end justify-between">
            <h2 className="flex items-center gap-2 font-display text-2xl font-black tracking-tight">
              <Flame size={22} className="text-ember" /> Trending now
            </h2>
            <Link to="/shop?sort=popular" className="text-sm font-bold text-ember hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-[7/8]" />)}
            </div>
          ) : trending.length === 0 ? (
            <p className="mt-5 text-sm text-ink/60">No trending products yet.</p>
          ) : (
            <div className="mt-5"><ProductGrid products={trending.slice(0, 4)} /></div>
          )}
        </section>

        {/* ── Mega drop banner ── */}
        {mega && (
          <section className="mt-14 overflow-hidden rounded-3xl bg-ink text-paper">
            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-12">
                <Badge>{mega.hero_label || 'Mega drop of the year'}</Badge>
                <h2 className="mt-3 font-display text-3xl font-black leading-tight md:text-4xl">{mega.title}</h2>
                <p className="mt-3 max-w-md text-sm text-paper/70">{mega.description}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-ember">
                  Status: {dropState(mega)}
                </p>
                <Link to={`/drops/${mega.slug}`} className="mt-5 inline-flex items-center gap-2 rounded-full bg-ember px-6 py-3 text-sm font-bold text-white hover:bg-ember-dark">
                  Explore the mega drop <ArrowRight size={16} />
                </Link>
              </div>
              <div className="flex min-h-56 items-center justify-center bg-ember p-8">
                <p className="text-center font-display text-5xl font-black leading-none text-ink">
                  MEGA<br />DROP
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── New arrivals ── */}
        <section className="mt-14">
          <div className="flex items-end justify-between">
            <h2 className="flex items-center gap-2 font-display text-2xl font-black tracking-tight">
              <Sparkles size={22} className="text-ember" /> New arrivals
            </h2>
            <Link to="/shop?sort=new" className="text-sm font-bold text-ember hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-[7/8]" />)}
            </div>
          ) : fresh.length === 0 ? (
            <p className="mt-5 text-sm text-ink/60">Nothing new yet — check back after the next drop.</p>
          ) : (
            <div className="mt-5"><ProductGrid products={fresh.slice(0, 4)} /></div>
          )}
        </section>
      </div>
    </div>
  );
}
