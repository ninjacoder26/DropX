import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Button, Field, Input } from '../components/ui';

export default function ResetPasswordPage() {
  const nav = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  // The recovery email links here with a session in the URL hash.
  // Supabase parses it automatically; we just wait for a session.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setReady(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="font-display text-3xl font-black">Set a new password</h1>
      {!ready ? (
        <p className="mt-4 rounded-2xl bg-white p-6 text-sm text-ink/60 shadow-card ring-1 ring-ink/5">
          This link is invalid or has expired. Request a fresh one from the{' '}
          <Link to="/forgot-password" className="font-bold text-ember">forgot-password page</Link>.
        </p>
      ) : (
        <form
          className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink/5"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            if (password.length < 8) {
              setError('Password must be at least 8 characters.');
              return;
            }
            if (password !== confirm) {
              setError('Passwords do not match.');
              return;
            }
            setBusy(true);
            supabase.auth.updateUser({ password }).then(({ error: err }) => {
              setBusy(false);
              if (err) setError(err.message);
              else nav('/account');
            });
          }}
        >
          <Field label="New password (min 8 characters)">
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="Confirm new password">
            <Input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </Field>
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
          <Button className="w-full" disabled={busy}>{busy ? 'Saving…' : 'Save new password'}</Button>
        </form>
      )}
    </div>
  );
}
