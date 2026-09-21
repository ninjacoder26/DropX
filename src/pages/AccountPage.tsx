import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Trash2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { uploadAvatar } from '../lib/avatar';
import { useAuth } from '../store/AuthContext';
import type { Address } from '../types';
import { districtOfArea, isGuidedComplete } from '../lib/address';
import { AddressForm } from '../components/AddressForm';
import { Button, Field, Input } from '../components/ui';

const EMPTY_DRAFT = { label: 'Home', full_name: '', phone: '', district: 'Kathmandu', area: '', street: '', postal_code: '' };

export default function AccountPage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [addrs, setAddrs] = useState<Address[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
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
    if (!user || !isSupabaseConfigured) return;
    supabase.from('addresses').select('*').eq('user_id', user.id).order('created_at')
      .then(({ data }) => setAddrs((data ?? []) as Address[]));
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
            {msg && <p className="text-xs text-ink/70">{msg}</p>}
            <Button
              disabled={saving}
              onClick={() => {
                if (!user) return;
                setSaving(true);
                supabase.from('profiles').update({ full_name: name, phone }).eq('id', user.id)
                  .then(({ error }) => {
                    setMsg(error ? error.message : 'Profile saved.');
                    if (!error) void refreshProfile();
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
                    }
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
          <ul className="mt-3 space-y-2">
            {addrs.length === 0 && <li className="text-sm text-ink/50">No addresses yet.</li>}
            {addrs.map((a) => (
              <li key={a.id} className="rounded-xl border border-ink/10 p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold">{a.label} {a.is_default && <span className="ml-1 rounded-full bg-ember/10 px-2 py-0.5 text-[10px] text-ember">DEFAULT</span>}</p>
                  <button
                    onClick={() => {
                      if (!confirm(`Delete the “${a.label}” address?`)) return;
                      supabase.from('addresses').delete().eq('id', a.id).then(({ error }) => {
                        if (!error) setAddrs(addrs.filter((x) => x.id !== a.id));
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
        </section>
      </div>
    </div>
  );
}
