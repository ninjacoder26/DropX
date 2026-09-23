import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AuthShell } from '../components/AuthShell';
import { Button, Field, Input } from '../components/ui';
import { usePageTitle } from '../hooks/usePageTitle';

export default function ResetPasswordPage() {
  const nav = useNavigate();
  usePageTitle('Set a new password');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState<boolean | null>(null);
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
    <AuthShell
      kicker="Almost there"
      title="Set a new password"
      sub="Choose something strong — you will use it at every login."
    >
      {ready === null ? (
        <p className="rounded-2xl bg-paper p-6 text-sm text-ink/60">
          Checking your recovery link…
        </p>
      ) : !ready ? (
        <p className="rounded-2xl bg-paper p-6 text-sm text-ink/60">
          This link is invalid or has expired. Request a fresh one from the{' '}
          <Link to="/forgot-password" className="font-bold text-ember">forgot-password page</Link>.
        </p>
      ) : (
        <form
          className="space-y-4"
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
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className="!py-3 !text-base" />
          </Field>
          <Field label="Confirm new password">
            <Input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className="!py-3 !text-base" />
          </Field>
          {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
          <Button className="w-full !min-h-[48px] !text-base" disabled={busy}>{busy ? 'Saving…' : 'Save new password'}</Button>
        </form>
      )}
    </AuthShell>
  );
}
