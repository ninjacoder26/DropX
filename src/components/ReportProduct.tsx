import { useEffect, useState } from 'react';
import { Check, Flag, Link2, MoreVertical, X } from 'lucide-react';
import { clsx } from 'clsx';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { analyticsSessionId } from '../lib/analytics';
import { LIMITS, isValidEmail } from '../lib/validation';
import { cloudinaryThumb } from '../lib/shop';
import { useAuth } from '../store/AuthContext';
import type { Product } from '../types';
import { Button, Field, Input } from './ui';

type Phase = 'menu' | 'form' | 'sending' | 'done' | 'exists';

/**
 * Discreet overflow menu on product pages: copy link + image-rights report.
 * The report form collects brand, contact, URLs and reason — nothing more.
 */
export function ReportProduct({ product }: { product: Product }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('menu');
  const [copied, setCopied] = useState(false);
  const [brand, setBrand] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [imageUrl, setImageUrl] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [refId, setRefId] = useState('');

  const images = (product.images ?? []).filter((im) => !im.is_hidden);

  useEffect(() => {
    setEmail(user?.email ?? '');
  }, [user?.email]);

  useEffect(() => {
    if (open) {
      setPhase('menu');
      setError(null);
    }
  }, [open ]);

  function copyLink() {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(
        () => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        },
        () => undefined
      );
    }
    setOpen(false);
  }

  async function submit() {
    setError(null);
    const b = brand.trim();
    const e = email.trim();
    const r = reason.trim();
    if (b.length < LIMITS.brandName.min || b.length > LIMITS.brandName.max) {
      setError(`Brand/company name must be ${LIMITS.brandName.min}–${LIMITS.brandName.max} characters.`);
      return;
    }
    if (!isValidEmail(e)) {
      setError('Enter a valid contact email.');
      return;
    }
    if (!imageUrl) {
      setError('Choose which image this concerns.');
      return;
    }
    if (r.length < LIMITS.reason.min || r.length > LIMITS.reason.max) {
      setError(`Reason must be ${LIMITS.reason.min}–${LIMITS.reason.max} characters.`);
      return;
    }
    if (!isSupabaseConfigured) {
      setError('Backend is not configured.');
      return;
    }
    setPhase('sending');
    // Same customer, same image, still pending → already reported.
    const sid = analyticsSessionId();
    const dup = user
      ? await supabase.from('image_requests').select('id').eq('user_id', user.id).eq('product_id', product.id).eq('image_url', imageUrl).eq('status', 'pending').limit(1)
      : await supabase.from('image_requests').select('id').is('user_id', null).eq('session_id', sid).eq('product_id', product.id).eq('image_url', imageUrl).eq('status', 'pending').limit(1);
    if (!dup.error && (dup.data ?? []).length > 0) {
      setPhase('exists');
      return;
    }
    const { data, error: err } = await supabase
      .from('image_requests')
      .insert({
        user_id: user?.id ?? null,
        session_id: sid,
        brand_name: b,
        contact_email: e,
        product_id: product.id,
        image_url: imageUrl,
        product_url: window.location.href.slice(0, 500),
        reason: r,
      })
      .select('id')
      .single();
    if (err) {
      if (err.code === '23505') setPhase('exists');
      else {
        setError(err.message);
        setPhase('form');
      }
      return;
    }
    setRefId(((data as { id: string }).id ?? '').slice(0, 8));
    setPhase('done');
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="More actions"
        aria-expanded={open}
        className="rounded-full border border-ink/15 bg-white p-3 transition hover:border-ink/40"
      >
        <MoreVertical size={17} />
      </button>

      {open && (
        <>
          <button aria-label="Close menu" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute bottom-12 right-0 z-50 w-60 overflow-hidden rounded-2xl bg-white shadow-pop ring-1 ring-ink/10">
            {phase === 'menu' && (
              <div className="p-1.5">
                <button
                  onClick={copyLink}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition hover:bg-ink/5"
                >
                  {copied ? <Check size={15} className="text-ember" /> : <Link2 size={15} />}
                  {copied ? 'Link copied' : 'Copy product link'}
                </button>
                <button
                  onClick={() => {
                    setPhase('form');
                    if (images.length === 1) setImageUrl(images[0].secure_url);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition hover:bg-ink/5"
                >
                  <Flag size={15} />
                  Report image issue…
                </button>
              </div>
            )}

            {(phase === 'form' || phase === 'sending' || phase === 'exists') && (
              <div className="max-h-[70vh] overflow-y-auto p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-display text-sm font-extrabold">Image ownership report</p>
                  <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-1 hover:bg-ink/5">
                    <X size={14} />
                  </button>
                </div>
                {phase === 'exists' ? (
                  <p className="text-xs leading-relaxed text-ink/70">
                    This image is already under review — our team will resolve it shortly. No need to report twice.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <Field label="Brand / company name">
                      <Input value={brand} onChange={(e) => setBrand(e.target.value)} maxLength={120} placeholder="Acme Inc." autoComplete="organization" />
                    </Field>
                    <Field label="Contact email">
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="legal@example.com" autoComplete="email" />
                    </Field>
                    <Field label="Which image?">
                      <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Disputed image">
                        {images.map((im) => (
                          <button
                            key={im.id}
                            type="button"
                            role="radio"
                            aria-checked={imageUrl === im.secure_url}
                            onClick={() => setImageUrl(im.secure_url)}
                            className={clsx(
                              'aspect-square overflow-hidden rounded-lg ring-2 transition',
                              imageUrl === im.secure_url ? 'ring-ember' : 'ring-transparent hover:ring-ink/20'
                            )}
                          >
                            <img src={cloudinaryThumb(im.secure_url, 200, 'eco')} alt="" loading="lazy" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                      {images.length === 0 && <p className="text-xs text-ink/50">No images on this product.</p>}
                    </Field>
                    <Field label={`Reason (${LIMITS.reason.min}–${LIMITS.reason.max} chars)`}>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        maxLength={2000}
                        placeholder="e.g. This photo was taken by our studio and used without permission…"
                        className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm"
                      />
                    </Field>
                    {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
                    <Button onClick={submit} disabled={phase === 'sending'} className="w-full">
                      {phase === 'sending' ? 'Sending…' : 'Submit report'}
                    </Button>
                    <p className="text-center text-[11px] text-ink/50">Reviewed by a human — nothing is auto-removed.</p>
                  </div>
                )}
              </div>
            )}

            {phase === 'done' && (
              <div className="p-5 text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <Check size={18} />
                </span>
                <p className="mt-2 font-display text-sm font-extrabold">Report received</p>
                <p className="mt-1 text-xs text-ink/60">
                  Reference <strong className="font-mono text-ink">{refId || '—'}</strong>. We review every
                  report and reply to your email.
                </p>
                <button onClick={() => setOpen(false)} className="mt-3 rounded-full bg-ink px-5 py-2 text-xs font-bold text-paper">
                  Done
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
