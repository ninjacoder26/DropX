import { useEffect, useState } from 'react';
import { BellRing, Check } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { analyticsSessionId, normalizeQuery } from '../lib/analytics';
import { useAuth } from '../store/AuthContext';
import { Button } from './ui';

type State = 'idle' | 'checking' | 'exists' | 'ready' | 'sending' | 'done' | 'error';

/**
 * "Can't find it? Ask for it." Shown on empty search results.
 * Dedupes per customer (or per browser session when logged out) so the
 * same ask isn't stored twice — the count shown is real demand data.
 */
export function RequestProduct({ query, categorySlug }: { query: string; categorySlug?: string }) {
  const { user } = useAuth();
  const [state, setState] = useState<State>('idle');
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const clean = normalizeQuery(query);

  useEffect(() => {
    setState('idle');
    setCount(0);
    setError(null);
    if (!isSupabaseConfigured || clean.length < 2) return;
    setState('checking');
    (async () => {
      const base = supabase.from('product_requests').select('id', { count: 'exact', head: true }).eq('query', clean);
      const mine = user
        ? await base.eq('user_id', user.id)
        : await base.is('user_id', null).eq('session_id', analyticsSessionId());
      if (mine.error) {
        setState('ready');
        return;
      }
      if ((mine.count ?? 0) > 0) {
        setState('exists');
        return;
      }
      const total = await supabase
        .from('product_requests')
        .select('id', { count: 'exact', head: true })
        .eq('query', clean);
      setCount(total.count ?? 0);
      setState('ready');
    })();
  }, [clean, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit() {
    if (!clean || state === 'sending') return;
    setState('sending');
    setError(null);
    const { error: err } = await supabase.from('product_requests').insert({
      user_id: user?.id ?? null,
      session_id: analyticsSessionId(),
      query: clean,
      category_slug: categorySlug ?? null,
    });
    if (err) {
      // Unique-violation race (double click / two tabs) just means it exists.
      if (err.code === '23505') setState('exists');
      else {
        setError(err.message);
        setState('ready');
      }
      return;
    }
    const total = await supabase
      .from('product_requests')
      .select('id', { count: 'exact', head: true })
      .eq('query', clean);
    setCount((total.count ?? 1) - 1);
    setState('done');
  }

  if (!isSupabaseConfigured || clean.length < 2) return null;

  return (
    <div className="rounded-2xl border border-dashed border-ink/20 bg-white p-5 text-center shadow-card">
      {state === 'done' ? (
        <>
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
            <Check size={18} />
          </span>
          <p className="mt-2 font-display font-extrabold">Request received!</p>
          <p className="mt-1 text-sm text-ink/60">
            We will source “{query.trim()}” if enough shoppers ask.
            {count > 0 && <> You join <strong className="text-ink">{count} other{count === 1 ? '' : 's'}</strong> waiting for it.</>}
          </p>
        </>
      ) : (
        <>
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-ember/10 text-ember">
            <BellRing size={18} />
          </span>
          <p className="mt-2 font-display font-extrabold">Can’t find “{query.trim()}”?</p>
          <p className="mt-1 text-sm text-ink/60">
            {state === 'exists'
              ? 'Good news — you already asked for this. We will source it if demand grows.'
              : 'Tell us and we will try to source it for DropX.'}
            {state === 'ready' && count > 0 && (
              <> <strong className="text-ink">{count} shopper{count === 1 ? '' : 's'}</strong> already waiting.</>
            )}
          </p>
          {state !== 'exists' && (
            <Button onClick={submit} disabled={state === 'checking' || state === 'sending'} className="mt-3">
              {state === 'sending' ? 'Sending…' : state === 'checking' ? 'Checking…' : 'Request this product'}
            </Button>
          )}
          {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
        </>
      )}
    </div>
  );
}
