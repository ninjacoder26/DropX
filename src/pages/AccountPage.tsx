import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Trash2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { uploadAvatar } from '../lib/avatar';
import { useAuth } from '../store/AuthContext';
import type { Address } from '../types';
import { districtOfArea, isGuidedComplete } from '../lib/address';
import { isMissingColumnError, NEEDS_MIGRATION_MSG } from '../lib/checkoutProfile';
import { AddressForm } from '../components/AddressForm';
import { usePwaInstall } from '../lib/pwaInstall';
import { Button, EmptyState, Field, Input, Notice, Skeleton } from '../components/ui';
import { usePageTitle } from '../hooks/usePageTitle';

const EMPTY_DRAFT = { label: 'Home', full_name: '', phone: '', district: 'Kathmandu', area: '', street: '', postal_code: '' };

export default function AccountPage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  usePageTitle('My Account');
  const [name, setName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [addrs, setAddrs] = useState<Address[]>([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [addrMsg, setAddrMsg] = useState<string | null>(null);
  const [addrOk, setAddrOk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);
  const [showAddr, setShowAddr] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<string | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState({ ...EMPTY_DRAFT });

  useEffect(() => {
    setName(profile?.full_name ?? '');
    setPhone(profile?.phone ?? '');
  }, [profile]);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      setAddrLoading(false);
      return;
    }
    supabase.from('addresses').select('*').eq('user_id', user.id).order('created_at')
      .then(({ data, error }) => {
        if (!error) setAddrs((data ?? []) as Address[]);
        setAddrLoading(false);
      }, () => setAddrLoading(false));
  }, [user]);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl font-black">My account</h1>
      <p className="mt-1 text-sm text-ink/60">{user?.email} · {profile?.role ?? 'customer'}</p>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink/5">
          <h2 className="font-display text-lg font-extrabold">Profile</h2>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile photo" className="h-16 w-16 rounded-full object-cover ring-2 ring-ember/30" />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ink font-display text-xl font-black text-paper">
                  {(profile?.full_name || user?.email || 'D')[0].toUpperCase()}
                </span>
              )}
              <button
                onClick={() => avatarRef.current?.click()}
                disabled={avatarBusy}
                aria-label="Upload profile photo"
                className="absolute -bottom-1 -right-1 rounded-full bg-ember p-1.5 text-white shadow transition hover:bg-ember-dark disabled:opacity-50"
              >
                <Camera size={13} />
              </button>
              <input
                ref={avatarRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f || !user) return;
                  setAvatarMsg(null);
                  setAvatarBusy(true);
                  uploadAvatar(user.id, f)
                    .then(() => {
                      setAvatarMsg('Photo updated.');
                      return refreshProfile();
                    })
                    .catch((err: Error) => setAvatarMsg(err.message))
                    .finally(() => {
                      setAvatarBusy(false);
                      if (avatarRef.current) avatarRef.current.value = '';
                    });
                }}
              />
            </div>
            <div className="text-xs text-ink/60">
              <p className="font-bold text-ink">{avatarBusy ? 'Uploading…' : 'Profile photo'}</p>
              <p>JPG/PNG/WebP · under 2 MB · stored in Supabase</p>
              {avatarMsg && <p className="mt-0.5 font-semibold">{avatarMsg}</p>}
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <Field label="Full name">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98XXXXXXXX" />
            </Field>
            {msg && (
              <Notice tone={saveOk ? 'success' : 'error'}>{msg}</Notice>
            )}
            <Button
              disabled={saving}
              onClick={() => {
                if (!user) return;
                setSaving(true);
                setMsg(null);
                supabase.from('profiles').update({ full_name: name, phone }).eq('id', user.id)
                  .then(({ error }) => {
                    setSaveOk(!error);
                    setMsg(error ? error.message : 'Profile saved.');
                    if (!error) void refreshProfile();
                    setSaving(false);
                  }, () => {
                    setSaveOk(false);
                    setMsg('Could not reach the server. Try again.');
                    setSaving(false);
                  });
              }}
            >
              {saving ? 'Saving…' : 'Save profile'}
            </Button>
          </div>
          <div className="mt-5 flex gap-2 border-t border-ink/10 pt-4">
            <Link to="/orders" className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-paper">Order history</Link>
            <button onClick={() => void signOut()} className="rounded-full border border-ink/15 px-4 py-2 text-xs font-bold">Log out</button>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink/5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold">Addresses</h2>
            <button onClick={() => setShowAddr(!showAddr)} className="text-xs font-bold text-ember">
              {showAddr ? 'Cancel' : '+ Add address'}
            </button>
          </div>
          {addrMsg && (
            <div className="mt-3">
              <Notice tone={addrOk ? 'success' : 'error'}>{addrMsg}</Notice>
            </div>
          )}
          {showAddr && (
            <form
              className="mt-3 space-y-3 rounded-xl bg-paper p-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!user || !isGuidedComplete(draft)) return;
                supabase.from('addresses').insert({
                  user_id: user.id,
                  label: draft.label || 'Home',
                  full_name: draft.full_name,
                  phone: draft.phone,
                  province: 'Bagmati',
                  city: draft.area,
                  street: draft.street,
                  postal_code: draft.postal_code || null,
                  is_default: addrs.length === 0,
                })
                  .select().single()
                  .then(({ data, error }) => {
                    if (!error && data) {
                      setAddrs([...addrs, data as Address]);
                      setDraft({ ...EMPTY_DRAFT, label: 'Home' });
                      setShowAddr(false);
                      setAddrOk(true);
                      setAddrMsg('Address saved.');
                    } else if (error) {
                      setAddrOk(false);
                      setAddrMsg(error.message);
                    }
                  }, () => {
                    setAddrOk(false);
                    setAddrMsg('Could not reach the server. Try again.');
                  });
              }}
            >
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Label (Home)" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} aria-label="Address label" />
                <Input placeholder="Full name" value={draft.full_name} onChange={(e) => setDraft({ ...draft, full_name: e.target.value })} required />
                <Input placeholder="Phone" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} required className="col-span-2 sm:col-span-1" />
              </div>
              <AddressForm
                value={{ district: draft.district, area: draft.area, street: draft.street, postal_code: draft.postal_code }}
                onChange={(v) => setDraft({ ...draft, district: v.district, area: v.area, street: v.street, postal_code: v.postal_code })}
              />
              <Button className="w-full" variant="dark">Save address</Button>
            </form>
          )}
          {addrLoading ? (
            <div className="mt-3 space-y-2"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
          ) : addrs.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="No addresses yet" body="Save one now and checkout prefills it every time." />
            </div>
          ) : (
          <ul className="mt-3 space-y-2">
            {addrs.map((a) => (
              <li key={a.id} className="rounded-xl border border-ink/10 p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold">{a.label} {a.is_default && <span className="ml-1 rounded-full bg-ember/10 px-2 py-0.5 text-[10px] text-ember">DEFAULT</span>}</p>
                  <button
                    onClick={() => {
                      if (!confirm(`Delete the “${a.label}” address?`)) return;
                      supabase.from('addresses').delete().eq('id', a.id).then(({ error }) => {
                        if (!error) {
                          setAddrs(addrs.filter((x) => x.id !== a.id));
                          setAddrOk(true);
                          setAddrMsg('Address deleted.');
                        } else {
                          setAddrOk(false);
                          setAddrMsg(error.message);
                        }
                      }, () => {
                        setAddrOk(false);
                        setAddrMsg('Could not reach the server. Try again.');
                      });
                    }}
                    aria-label={`Delete ${a.label} address`}
                    className="shrink-0 rounded-full p-1 text-ink/40 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-ink/60">{a.full_name} · {a.phone}</p>
                <p className="text-ink/60">{a.street}, {a.city}{districtOfArea(a.city) ? `, ${districtOfArea(a.city)}` : ''}</p>
              </li>
            ))}
          </ul>
          )}
        </section>
      </div>

      <section className="mt-5 rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink/5">
        <h2 className="font-display text-lg font-extrabold">Checkout defaults</h2>
        <p className="mt-1 text-xs text-ink/60">
          Saved once, prefilled at every checkout — update here and skip typing forever.
        </p>
        <CheckoutDefaultsForm />
      </section>
      <InstallAppCard />
    </div>
  );
}

function InstallAppCard() {
  const { canInstall, showIOSHint, install } = usePwaInstall();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  if (!canInstall && !showIOSHint) return null;
  return (
    <section className="mt-5 overflow-hidden rounded-2xl bg-ink text-paper shadow-card">
      <div className="flex items-center gap-4 p-6">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ember font-display text-base font-black text-white">
          DX
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-extrabold">Get the DropX app</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-paper/60">
            {canInstall
              ? 'Install for full-screen shopping, faster loads and offline browsing.'
              : 'On iPhone: tap Share, then “Add to Home Screen” for full-screen shopping.'}
          </p>
        </div>
        {canInstall && (
          <Button
            disabled={busy || done}
            onClick={() => {
              setBusy(true);
              void install().finally(() => {
                setBusy(false);
                setDone(true);
              });
            }}
            className="!bg-ember !px-5 !py-2.5 hover:!bg-ember-dark"
          >
            {done ? 'Done!' : busy ? '…' : 'Install'}
          </Button>
        )}
      </div>
    </section>
  );
}

function CheckoutDefaultsForm() {
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    name: profile?.checkout_name ?? '',
    phone: profile?.checkout_phone ?? '',
    district: profile?.checkout_district || 'Kathmandu',
    area: profile?.checkout_area ?? '',
    street: profile?.checkout_street ?? '',
    postal: profile?.checkout_postal ?? '',
    method: (profile?.preferred_shipping === 'express' ? 'express' : 'standard') as 'standard' | 'express',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [defaultsOk, setDefaultsOk] = useState(false);
  // Fill once when the profile first arrives — never clobber typing afterwards.
  const syncedRef = useRef(false);

  useEffect(() => {
    if (syncedRef.current || !profile) return;
    syncedRef.current = true;
    setForm({
      name: profile.checkout_name ?? '',
      phone: profile.checkout_phone ?? '',
      district: profile.checkout_district || 'Kathmandu',
      area: profile.checkout_area ?? '',
      street: profile.checkout_street ?? '',
      postal: profile.checkout_postal ?? '',
      method: (profile.preferred_shipping === 'express' ? 'express' : 'standard') as 'standard' | 'express',
    });
  }, [profile]);

  if (!user) return null;
  const complete =
    form.name.trim().length >= 2 &&
    form.phone.trim().length >= 7 &&
    isGuidedComplete({ district: form.district, area: form.area, street: form.street, postal_code: form.postal });

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <Field label="Full name">
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} />
      </Field>
      <Field label="Phone">
        <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={20} />
      </Field>
      <div className="md:col-span-2">
              <AddressForm
                value={{ district: form.district, area: form.area, street: form.street, postal_code: form.postal }}
                onChange={(v) => setForm({ ...form, district: v.district, area: v.area, street: v.street, postal: v.postal_code })}
              />
      </div>
      <Field label="Preferred shipping">
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Preferred shipping">
          {(['standard', 'express'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={form.method === m}
              onClick={() => setForm({ ...form, method: m })}
              className={`rounded-xl border px-3 py-2.5 text-sm font-bold capitalize transition ${
                form.method === m ? 'border-ink bg-ink text-paper' : 'border-ink/15 bg-white hover:border-ink/40'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </Field>
      <div className="flex items-end">
        <Button
          variant="dark"
          className="w-full"
          disabled={saving || !complete}
          onClick={() => {
            if (!user || !complete) return;
            setSaving(true);
            setMsg(null);
            supabase.from('profiles').update({
              checkout_name: form.name.trim(),
              checkout_phone: form.phone.trim(),
              checkout_district: form.district,
              checkout_area: form.area,
              checkout_street: form.street,
              checkout_postal: form.postal || null,
              preferred_shipping: form.method,
            }).eq('id', user.id).then(({ error }) => {
              setSaving(false);
              if (error) {
                setDefaultsOk(false);
                setMsg(isMissingColumnError(error) ? NEEDS_MIGRATION_MSG : error.message);
              } else {
                setDefaultsOk(true);
                setMsg('Saved — checkout will prefill these next time.');
                void refreshProfile();
              }
            }, () => {
              setSaving(false);
              setDefaultsOk(false);
              setMsg('Could not reach the server. Try again.');
            });
          }}
        >
          {saving ? 'Saving…' : 'Save checkout defaults'}
        </Button>
      </div>
      {msg && (
        <div className="md:col-span-2">
          <Notice tone={defaultsOk ? 'success' : 'error'}>{msg}</Notice>
        </div>
      )}
    </div>
  );
}
