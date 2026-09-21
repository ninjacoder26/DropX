import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Flame, Sparkles, Truck, ShieldCheck, RefreshCcw, History } from 'lucide-react';
import { fetchCategories, fetchDrops, fetchProducts, fetchProductsByIds } from '../lib/catalog';
import { isSupabaseConfigured } from '../lib/supabase';
import { cloudinaryThumb } from '../lib/shop';
import type { Category, Drop, Product } from '../types';
import { dropState } from '../types';
import { useRecentlyViewed } from '../hooks/useShop';
import { ProductGrid } from '../components/product';
import { Badge, Skeleton } from '../components/ui';
import { SetupNotice } from '../components/layout';

const MARQUEE = ['DESIGNED IN KATHMANDU', 'HEAVYWEIGHT FLEECE', 'CASH ON DELIVERY', 'NEW DROPS MONTHLY', 'MEGA DROP EVERY YEAR', '7-DAY EXCHANGES'];

function CategoryTile({ category }: { category: Category }) {
  return (
    <Link
      to={`/shop?category=${category.slug}`}
      className="group relative overflow-hidden rounded-2xl bg-ink text-paper transition duration-300 hover:-translate-y-1 hover:shadow-pop"
    >
      {category.image_url ? (
        <img
          src={cloudinaryThumb(category.image_url, 600)}
          alt=""
          loading="lazy"
          className="aspect-[4/3] w-full object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-60"
        />
      ) : (
        <div className="aspect-[4/3] w-full bg-ink-soft transition group-hover:bg-ink-mute" />
      )}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink via-ink/20 to-transparent p-5">
        <p className="font-display text-xl font-extrabold leading-tight">{category.name}</p>
        {category.description && <p className="mt-0.5 line-clamp-1 text-xs text-paper/70">{category.description}</p>}
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-ember">
          Shop now <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
        </p>
      </div>
    </Link>
  );
}

function DropSpotlight({ drop, mega }: { drop: Drop; mega?: boolean }) {
  return (
    <section className={`overflow-hidden rounded-3xl ring-1 ${mega ? 'bg-ink text-paper ring-paper/10' : 'bg-white ring-ink/10'}`}>
      <div className="grid md:grid-cols-2">
        <div className="relative min-h-56 overflow-hidden md:min-h-72">
          {drop.artwork_url ? (
            <img src={cloudinaryThumb(drop.artwork_url, 1000)} alt={`${drop.title} artwork`} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className={`flex h-full min-h-56 items-center justify-center p-8 md:min-h-72 ${mega ? 'bg-ember' : 'bg-ink'}`}>
              <p className="text-center font-display text-5xl font-black leading-none text-paper">
                {mega ? <>MEGA<br />DROP</> : <>MONTHLY<br />DROP</>}
              </p>
            </div>
          )}
          <span className="absolute left-4 top-4">
            <Badge tone={mega ? 'ember' : 'ink'}>{drop.hero_label || (mega ? 'Mega drop of the year' : 'Drop of the month')}</Badge>
          </span>
        </div>
        <div className="flex flex-col justify-center p-7 md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ember">
            Live now · ends {new Date(drop.ends_at).toLocaleDateString('en-NP', { month: 'short', day: 'numeric' })}
          </p>
          <h2 className="mt-2 font-display text-3xl font-black leading-tight md:text-4xl">{drop.title}</h2>
          <p className={`mt-3 max-w-md text-sm leading-relaxed ${mega ? 'text-paper/70' : 'text-ink/60'}`}>{drop.description}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to={`/drops/${drop.slug}`}
              className="inline-flex items-center gap-2 rounded-full bg-ember px-6 py-3 text-sm font-bold text-white transition hover:bg-ember-dark"
            >
              Shop the drop <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </div>
      {(drop.products?.length ?? 0) > 0 && (
        <div className={`px-5 pb-6 md:px-8 ${mega ? '' : ''}`}>
          <ProductGrid products={drop.products!.slice(0, 4)} />
        </div>
      )}
    </section>
  );
}

export default function HomePage() {
  const [trending, setTrending] = useState<Product[]>([]);
  const [fresh, setFresh] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [monthly, setMonthly] = useState<Drop | null>(null);
  const [mega, setMega] = useState<Drop | null>(null);
  const [upcomingMega, setUpcomingMega] = useState<Drop | null>(null);
  const [recent, setRecent] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { ids: recentIds } = useRecentlyViewed();

  useEffect(() => {
    (async () => {
      try {
        const [t, n, c, activeMonthly, activeMega, upcoming] = await Promise.all([
          fetchProducts({ trending: true, limit: 8 }),
          fetchProducts({ isNew: true, limit: 8 }),
          fetchCategories(),
          // Storefront rule: homepage only surfaces drops that are published
          // (enabled) AND currently inside their date window.
          fetchDrops('monthly', 'active'),
          fetchDrops('mega', 'active'),
          fetchDrops('mega', 'upcoming'),
        ]);
        setTrending(t);
        setFresh(n);
        setCats(c);
        setMonthly(activeMonthly[0] ?? null);
        setMega(activeMega[0] ?? null);
        const up = upcoming.filter((d) => dropState(d) === 'upcoming');
        setUpcomingMega(up[0] ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load storefront.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (recentIds.length === 0) return;
    fetchProductsByIds(recentIds).then(setRecent).catch(() => undefined);
  }, [recentIds]);

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-ink text-paper">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-ember/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-ember/10 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.1fr_1fr] md:py-20 lg:px-8">
          <div className="reveal flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-paper/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-paper/80">
              <span className="h-1.5 w-1.5 rounded-full bg-ember" /> New season · Nepal
            </span>
            <h1 className="mt-5 font-display text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl md:text-7xl">
              Wear the
              <br />
              <span className="text-ember">Drop.</span>
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-paper/70">
              Heavyweight streetwear designed in Kathmandu. A fresh drop every month,
              one Mega Drop a year — delivered to your doorstep anywhere in Nepal.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/shop" className="inline-flex items-center gap-2 rounded-full bg-ember px-7 py-3.5 text-sm font-bold text-white transition hover:bg-ember-dark">
                Shop the collection <ArrowRight size={16} />
              </Link>
              <Link to="/drops" className="inline-flex items-center gap-2 rounded-full border border-paper/25 px-7 py-3.5 text-sm font-bold transition hover:border-paper/60 hover:bg-paper/5">
                Explore drops
              </Link>
            </div>
            <dl className="mt-9 grid max-w-md grid-cols-3 gap-4 border-t border-paper/10 pt-6">
              {[
                ['120+', 'Products live'],
                ['7', 'Provinces served'],
                ['4.8★', 'Buyer rating'],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="font-display text-xl font-black text-ember">{v}</dt>
                  <dd className="mt-0.5 text-[11px] uppercase tracking-wider text-paper/50">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Hero drop panel — only live drops, never placeholders */}
          <div className="reveal reveal-1 relative min-h-80 overflow-hidden rounded-3xl ring-1 ring-paper/10 md:min-h-full">
            {(() => {
              const hero = monthly ?? mega;
              const art = hero?.artwork_url;
              if (!hero) {
                return (
                  <div className="flex h-full min-h-80 flex-col justify-between bg-ink-soft p-7">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ember">DropX basics</p>
                    <div>
                      <p className="font-display text-3xl font-black leading-tight">Everyday heavyweights, made to last.</p>
                      <Link to="/shop" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-ember underline underline-offset-4">
                        Browse the shop <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              }
              return (
                <>
                  {art ? (
                    <img src={cloudinaryThumb(art, 1000)} alt={`${hero.title} artwork`} fetchPriority="high" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-ember" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-7">
                    <Badge>{hero.hero_label || 'Drop of the month'}</Badge>
                    <p className="mt-2 font-display text-2xl font-black leading-tight md:text-3xl">{hero.title}</p>
                    <Link to={`/drops/${hero.slug}`} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-paper px-5 py-2.5 text-xs font-bold text-ink transition hover:bg-white">
                      Shop the drop <ArrowRight size={14} />
                    </Link>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Marquee */}
        <div className="relative border-t border-paper/10 bg-ink py-3" aria-hidden>
          <div className="marquee flex gap-8 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.25em] text-paper/50">
            {[...MARQUEE, ...MARQUEE].map((m, i) => (
              <span key={i} className="flex items-center gap-8">
                {m} <span className="text-ember">✦</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6 md:py-14 lg:px-8">
        {!isSupabaseConfigured && <SetupNotice area="homepage catalog" />}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">{error}</div>
        )}

        {/* ── Categories ── */}
        <section>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ember">Browse</p>
              <h2 className="mt-1 font-display text-2xl font-black tracking-tight sm:text-3xl">Shop by category</h2>
            </div>
            <Link to="/shop" className="shrink-0 text-sm font-bold text-ember hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-[4/3]" />)}
            </div>
          ) : cats.length === 0 ? (
            <p className="mt-5 rounded-2xl bg-white p-6 text-sm text-ink/60 ring-1 ring-ink/5">No categories yet — add them in the admin dashboard.</p>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {cats.slice(0, 4).map((c) => (
                <CategoryTile key={c.id} category={c} />
              ))}
            </div>
          )}
        </section>

        {/* ── Drop of the Month spotlight (active only) ── */}
        {monthly && (
          <DropSpotlight drop={monthly} />
        )}

        {/* ── Trending ── */}
        <section>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-ember">
                <Flame size={13} /> Hot right now
              </p>
              <h2 className="mt-1 font-display text-2xl font-black tracking-tight sm:text-3xl">Trending now</h2>
            </div>
            <Link to="/shop?sort=popular" className="shrink-0 text-sm font-bold text-ember hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-square" />)}
            </div>
          ) : trending.length === 0 ? (
            <p className="mt-5 text-sm text-ink/60">No trending products yet.</p>
          ) : (
            <div className="mt-5"><ProductGrid products={trending.slice(0, 4)} /></div>
          )}
        </section>

        {/* ── Mega drop (active full / upcoming teaser / hidden when ended) ── */}
        {mega ? (
          <DropSpotlight drop={mega} mega />
        ) : upcomingMega ? (
          <section className="overflow-hidden rounded-3xl bg-ink text-paper ring-1 ring-paper/10">
            <div className="grid items-center gap-6 p-7 md:grid-cols-[1fr_auto] md:p-10">
              <div>
                <Badge>{upcomingMega.hero_label || 'Mega drop of the year'}</Badge>
                <h2 className="mt-3 font-display text-3xl font-black leading-tight">{upcomingMega.title}</h2>
                <p className="mt-2 max-w-lg text-sm text-paper/70">{upcomingMega.description}</p>
                <p className="mt-3 text-xs font-bold uppercase tracking-widest text-ember">
                  Opens {new Date(upcomingMega.starts_at).toLocaleDateString('en-NP', { month: 'long', day: 'numeric' })} — watch this space
                </p>
              </div>
              <Link to={`/drops/${upcomingMega.slug}`} className="inline-flex items-center gap-2 rounded-full border border-paper/25 px-6 py-3 text-sm font-bold transition hover:border-paper/60">
                Preview the drop <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        ) : null}

        {/* ── New arrivals ── */}
        <section>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-ember">
                <Sparkles size={13} /> Fresh off the truck
              </p>
              <h2 className="mt-1 font-display text-2xl font-black tracking-tight sm:text-3xl">New arrivals</h2>
            </div>
            <Link to="/shop?sort=new" className="shrink-0 text-sm font-bold text-ember hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-square" />)}
            </div>
          ) : fresh.length === 0 ? (
            <p className="mt-5 text-sm text-ink/60">Nothing new yet — check back after the next drop.</p>
          ) : (
            <div className="mt-5"><ProductGrid products={fresh.slice(0, 4)} /></div>
          )}
        </section>

        {/* ── Recently viewed ── */}
        {recent.length > 0 && (
          <section>
            <h2 className="flex items-center gap-2 font-display text-2xl font-black tracking-tight">
              <History size={20} className="text-ember" /> Recently viewed
            </h2>
            <div className="mt-5"><ProductGrid products={recent.slice(0, 4)} /></div>
          </section>
        )}

        {/* ── Perks ── */}
        <section className="grid gap-3 rounded-3xl bg-ink p-6 text-paper sm:grid-cols-3 md:p-8">
          {[
            { icon: Truck, title: 'Nationwide delivery', body: '2–5 days across Nepal. Free standard shipping over NPR 2,999.' },
            { icon: ShieldCheck, title: 'Pay your way', body: 'Cash on Delivery or bank transfer — confirmed by our team.' },
            { icon: RefreshCcw, title: '7-day exchanges', body: 'Wrong size? Exchange within 7 days, no interrogation.' },
          ].map((p) => (
            <div key={p.title} className="rounded-2xl bg-paper/5 p-5 ring-1 ring-paper/10">
              <p.icon size={20} className="text-ember" />
              <p className="mt-3 font-display font-extrabold">{p.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-paper/60">{p.body}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
