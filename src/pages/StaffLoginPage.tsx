import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { AuthShell } from '../components/AuthShell';
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
    <AuthShell
      kicker="DropX staff"
      title="Staff sign in"
      sub="Username + password only — no email needed. Accounts are issued by a superadmin."
    >
      <form
        className="space-y-4"
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
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. photo-team" autoComplete="username" maxLength={24} className="!py-3 !text-base" />
        </Field>
        <Field label="Password">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" className="!py-3 !text-base" />
        </Field>
        {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
        <Button className="w-full !min-h-[48px] !text-base" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
      </form>
      <div className="mt-5 flex justify-between text-sm font-semibold">
        <Link to="/get-acc-info" className="text-ember hover:underline">Forgot login details?</Link>
        <Link to="/login" className="hover:underline">Customer login</Link>
      </div>
    </AuthShell>
  );
}
