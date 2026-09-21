import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CalendarClock } from 'lucide-react';
import { fetchDrops } from '../lib/catalog';
import { cloudinaryThumb } from '../lib/shop';
import type { Drop } from '../types';
import { dropState } from '../types';
import { ProductGrid } from '../components/product';
import { usePageTitle } from '../hooks/usePageTitle';
import { Badge, Skeleton } from '../components/ui';

function DropHero({ drop, mega }: { drop: Drop; mega?: boolean }) {
  const state = dropState(drop);
  const live = state === 'active';
  return (
    <section className={`overflow-hidden rounded-3xl ring-1 ${mega ? 'bg-ink text-paper ring-paper/10' : 'bg-white ring-ink/10'}`}>
      <div className="grid md:grid-cols-2">
        <div className="relative min-h-52 overflow-hidden">
          {drop.artwork_url ? (
            <img src={cloudinaryThumb(drop.artwork_url, 1000)} alt={`${drop.title} artwork`} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className={`flex h-full min-h-52 items-center justify-center p-8 ${mega ? 'bg-ember' : 'bg-ink'}`}>
              <p className="text-center font-display text-4xl font-black leading-none text-paper">
                {mega ? <>MEGA<br />DROP</> : <>MONTHLY<br />DROP</>}
              </p>
            </div>
          )}
          <span className="absolute left-4 top-4">
            <Badge tone={mega ? 'ember' : 'ink'}>{drop.hero_label || (mega ? 'Mega drop of the year' : 'Drop of the month')}</Badge>
          </span>
        </div>
        <div className="flex flex-col justify-center p-7 md:p-10">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-ember">
            <CalendarClock size={13} />
            {live && `Live · ends ${new Date(drop.ends_at).toLocaleDateString('en-NP', { month: 'short', day: 'numeric' })}`}
            {state === 'upcoming' && `Opens ${new Date(drop.starts_at).toLocaleDateString('en-NP', { month: 'long', day: 'numeric' })}`}
            {state === 'ended' && `Ended ${new Date(drop.ends_at).toLocaleDateString('en-NP', { month: 'short', day: 'numeric' })}`}
          </p>
          <h2 className="mt-2 font-display text-3xl font-black leading-tight">{drop.title}</h2>
          <p className={`mt-2 max-w-md text-sm leading-relaxed ${mega ? 'text-paper/70' : 'text-ink/60'}`}>{drop.description}</p>
          {live && (
            <Link to={`/drops/${drop.slug}`} className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-ember px-6 py-3 text-sm font-bold text-white transition hover:bg-ember-dark">
              Shop the drop <ArrowRight size={15} />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export default function DropsPage() {
  const { slug } = useParams();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPast, setShowPast] = useState(false);
  usePageTitle(slug ? 'Drop details' : 'Drops');

  useEffect(() => {
    fetchDrops().then((d) => {
      setDrops(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const live = drops.filter((d) => dropState(d) === 'active');
  const upcoming = drops.filter((d) => dropState(d) === 'upcoming');
  const ended = drops.filter((d) => dropState(d) === 'ended');
  const focused = slug ? drops.find((d) => d.slug === slug) : null;

  if (loading) {
    return <div className="mx-auto max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8 py-8"><Skeleton className="h-64" /><Skeleton className="h-40" /></div>;
  }

  // Single-drop view — ended drops keep their page (shared links don't rot),
  // but their products are only purchasable while the drop is live.
  if (slug) {
    if (!focused) {
      return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="font-display text-3xl font-black">Drop not found</h1>
          <Link to="/drops" className="mt-4 inline-block rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-paper">All drops</Link>
        </div>
      );
    }
    const isLive = dropState(focused) === 'active';
    return (
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/drops" className="text-xs font-bold text-ember hover:underline">← All drops</Link>
        <DropHero drop={focused} mega={focused.kind === 'mega'} />
        <div>
          <h2 className="font-display text-2xl font-black">Curated products ({focused.products?.length ?? 0})</h2>
          {(focused.products?.length ?? 0) === 0 || !isLive ? (
            <p className="mt-2 max-w-lg text-sm text-ink/60">
              {!isLive
                ? dropState(focused) === 'upcoming'
                  ? `This drop opens ${new Date(focused.starts_at).toLocaleDateString('en-NP', { month: 'long', day: 'numeric' })}. Products unlock when it goes live.`
                  : 'This drop has ended. Its pieces may return in future edits — browse the live shop meanwhile.'
                : 'Products for this drop are being curated.'}
            </p>
          ) : (
            <div className="mt-4"><ProductGrid products={focused.products!} /></div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8 py-8">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ember">Limited collections</p>
        <h1 className="mt-1 font-display text-3xl font-black tracking-tight sm:text-4xl">Drops</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink/60">
          Limited collections, curated monthly — plus one Mega Drop a year. Only live drops can be shopped; upcoming ones are previews.
        </p>
      </div>

      {live.length === 0 && upcoming.length === 0 && ended.length === 0 && (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-ink/60 ring-1 ring-ink/10">
          No published drops yet. Admins can create the Drop of the Month and Mega Drop of the Year in the dashboard.
        </p>
      )}

      {live.map((d) => (
        <div key={d.id}>
          <DropHero drop={d} mega={d.kind === 'mega'} />
          {(d.products?.length ?? 0) > 0 && (
            <div className="mt-4"><ProductGrid products={d.products!.slice(0, 4)} /></div>
          )}
          <Link to={`/drops/${d.slug}`} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-ember hover:underline">
            View full {d.kind === 'mega' ? 'mega drop' : 'drop'} <ArrowRight size={14} />
          </Link>
        </div>
      ))}

      {upcoming.length > 0 && (
        <section>
          <h2 className="font-display text-2xl font-black">Coming soon</h2>
          <p className="mt-1 text-sm text-ink/60">Teasers only — products unlock when each drop goes live.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {upcoming.map((d) => (
              <Link key={d.id} to={`/drops/${d.slug}`} className="group overflow-hidden rounded-3xl bg-ink text-paper ring-1 ring-paper/10 transition hover:-translate-y-0.5">
                {d.artwork_url ? (
                  <img src={cloudinaryThumb(d.artwork_url, 700, 'eco')} alt="" loading="lazy" className="aspect-[16/8] w-full object-cover opacity-90 transition group-hover:opacity-70" />
                ) : (
                  <div className="flex aspect-[16/8] items-center justify-center bg-ink-soft font-display text-3xl font-black text-paper/40">
                    {d.kind === 'mega' ? 'MEGA DROP' : 'MONTHLY DROP'}
                  </div>
                )}
                <div className="p-5">
                  <Badge tone={d.kind === 'mega' ? 'ember' : 'paper'}>{d.hero_label || 'Upcoming'}</Badge>
                  <p className="mt-2 font-display text-xl font-extrabold">{d.title}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-widest text-ember">
                    Opens {new Date(d.starts_at).toLocaleDateString('en-NP', { month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {ended.length > 0 && (
        <section>
          <button
            onClick={() => setShowPast(!showPast)}
            aria-expanded={showPast}
            className="rounded-full border border-ink/15 bg-white px-5 py-2.5 text-sm font-bold transition hover:border-ink/40"
          >
            {showPast ? 'Hide past drops' : `Past drops (${ended.length})`}
          </button>
          {showPast && (
            <ul className="mt-4 space-y-2">
              {ended.map((d) => (
                <li key={d.id}>
                  <Link to={`/drops/${d.slug}`} className="flex flex-wrap items-center gap-2 rounded-2xl bg-white px-5 py-3.5 ring-1 ring-ink/5 transition hover:shadow-card">
                    <span className="font-display font-extrabold">{d.title}</span>
                    <Badge tone="paper">{d.kind === 'mega' ? 'Mega' : 'Monthly'}</Badge>
                    <span className="ml-auto text-xs text-ink/50">
                      Ended {new Date(d.ends_at).toLocaleDateString('en-NP', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
