import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { fetchDrops } from '../lib/catalog';
import type { Drop } from '../types';
import { dropState } from '../types';
import { ProductGrid } from '../components/product';
import { Badge, Skeleton } from '../components/ui';

function DropHero({ drop, mega }: { drop: Drop; mega?: boolean }) {
  const state = dropState(drop);
  return (
    <section className={`overflow-hidden rounded-3xl ${mega ? 'bg-ink text-paper' : 'bg-white ring-1 ring-ink/10'}`}>
      <div className="grid md:grid-cols-2">
        <div className="p-8 md:p-10">
          <Badge tone={mega ? 'ember' : 'ink'}>{drop.hero_label || (mega ? 'Mega drop of the year' : 'Drop of the month')}</Badge>
          <h2 className="mt-3 font-display text-3xl font-black leading-tight">{drop.title}</h2>
          <p className={`mt-2 text-sm ${mega ? 'text-paper/70' : 'text-ink/60'}`}>{drop.description}</p>
          <p className="mt-2 text-xs font-bold uppercase tracking-widest text-ember">
            {state === 'active' && `Live · ends ${new Date(drop.ends_at).toLocaleDateString('en-NP', { month: 'short', day: 'numeric' })}`}
            {state === 'upcoming' && `Upcoming · starts ${new Date(drop.starts_at).toLocaleDateString('en-NP', { month: 'short', day: 'numeric' })}`}
            {state === 'ended' && `Ended ${new Date(drop.ends_at).toLocaleDateString('en-NP', { month: 'short', day: 'numeric' })}`}
          </p>
        </div>
        <div className={`flex min-h-48 items-center justify-center p-8 ${mega ? 'bg-ember' : 'bg-ink'}`}>
          {drop.artwork_url ? (
            <img src={drop.artwork_url} alt={`${drop.title} artwork`} className="max-h-64 rounded-2xl object-cover" loading="lazy" />
          ) : (
            <p className="text-center font-display text-4xl font-black leading-none text-paper">
              {mega ? <>MEGA<br />DROP</> : <>MONTHLY<br />DROP</>}
            </p>
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

  useEffect(() => {
    fetchDrops().then((d) => {
      setDrops(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const monthly = drops.filter((d) => d.kind === 'monthly');
  const mega = drops.filter((d) => d.kind === 'mega');
  const focused = slug ? drops.find((d) => d.slug === slug) : null;

  if (loading) {
    return <div className="mx-auto max-w-7xl space-y-4 px-4 py-8"><Skeleton className="h-64" /><Skeleton className="h-40" /></div>;
  }

  // Single-drop view
  if (slug) {
    if (!focused) {
      return (
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <h1 className="font-display text-3xl font-black">Drop not found</h1>
          <Link to="/drops" className="mt-4 inline-block rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-paper">All drops</Link>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <Link to="/drops" className="text-xs font-bold text-ember hover:underline">← All drops</Link>
        <DropHero drop={focused} mega={focused.kind === 'mega'} />
        <div>
          <h2 className="font-display text-2xl font-black">Curated products ({focused.products?.length ?? 0})</h2>
          {(focused.products?.length ?? 0) === 0 ? (
            <p className="mt-2 text-sm text-ink/60">Products for this drop are being curated.</p>
          ) : (
            <div className="mt-4"><ProductGrid products={focused.products!} /></div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8">
      <div>
        <h1 className="font-display text-4xl font-black tracking-tight">Drops</h1>
        <p className="mt-1 text-sm text-ink/60">Limited collections, curated monthly — plus one Mega Drop a year. Managed live from the admin dashboard.</p>
      </div>

      {mega.length === 0 && monthly.length === 0 && (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-ink/60 ring-1 ring-ink/10">
          No published drops yet. Admins can create the Drop of the Month and Mega Drop of the Year in the dashboard.
        </p>
      )}

      {mega.map((d) => (
        <div key={d.id}>
          <DropHero drop={d} mega />
          {(d.products?.length ?? 0) > 0 && (
            <div className="mt-4"><ProductGrid products={d.products!.slice(0, 4)} /></div>
          )}
          <Link to={`/drops/${d.slug}`} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-ember hover:underline">
            View full mega drop <ArrowRight size={14} />
          </Link>
        </div>
      ))}

      {monthly.map((d) => (
        <div key={d.id}>
          <DropHero drop={d} />
          {(d.products?.length ?? 0) > 0 && (
            <div className="mt-4"><ProductGrid products={d.products!.slice(0, 4)} /></div>
          )}
          <Link to={`/drops/${d.slug}`} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-ember hover:underline">
            View full drop <ArrowRight size={14} />
          </Link>
        </div>
      ))}
    </div>
  );
}
