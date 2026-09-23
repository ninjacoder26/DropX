import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { Button, Field, Input } from '../components/ui';
import { usePageTitle } from '../hooks/usePageTitle';

export default function StaffLoginPage() {
  const { signInSubadmin, user, loading, ready, isAdmin, isSubadmin } = useAuth();
  usePageTitle('Staff sign in');
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') === '/staff' ? '/staff' : '/staff';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || !ready || !user) return;
    if (isSubadmin) nav(next, { replace: true });
    else if (isAdmin) nav('/admin', { replace: true });
  }, [loading, ready, user, isSubadmin, isAdmin, next, nav]);

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-14">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ember">DropX staff</p>
      <h1 className="mt-1 font-display text-3xl font-black">Staff sign in</h1>
      <p className="mt-1 text-sm text-ink/60">Username + password only — no email needed. Accounts are issued by a superadmin.</p>
      <form
        className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink/5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!username.trim() || !password) {
            setError('Enter your username and password.');
            return;
          }
          setError(null);
          setBusy(true);
          void signInSubadmin(username, password).then(({ error: err }) => {
            setBusy(false);
            if (err) setError(err);
            else nav(next, { replace: true });
          });
        }}
      >
        <Field label="Staff username">
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. photo-team" autoComplete="username" maxLength={24} />
        </Field>
        <Field label="Password">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
        </Field>
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        <Button className="w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
        <div className="flex justify-between text-xs font-semibold">
          <Link to="/get-acc-info" className="text-ember hover:underline">Forgot login details?</Link>
          <Link to="/login" className="hover:underline">Customer login</Link>
        </div>
      </form>
    </div>
  );
}
