import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { Button, Field, Input } from '../components/ui';

function safeNext(raw: string | null): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/account';
}

export default function LoginPage() {
  const { signIn, signInWithGoogle, user, loading } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in (e.g. returned from OAuth)? Continue the journey.
  useEffect(() => {
    if (!loading && user) nav(next, { replace: true });
  }, [loading, user, next, nav]);

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="font-display text-3xl font-black">Welcome back</h1>
      <p className="mt-1 text-sm text-ink/60">
        {next === '/checkout'
          ? 'Log in to finish checking out — your bag is saved and waiting.'
          : 'Log in to check out faster and track orders.'}
      </p>
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink/5">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setError(null);
            void signInWithGoogle(next).then(({ error: e }) => {
              if (e) setError(e);
            });
          }}
        >
          Continue with Google
        </Button>
        <div className="my-4 flex items-center gap-3 text-xs text-ink/40">
          <span className="h-px flex-1 bg-ink/10" /> or with email <span className="h-px flex-1 bg-ink/10" />
        </div>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            setBusy(true);
            void signIn(email.trim(), password).then(({ error: err }) => {
              setBusy(false);
              if (err) setError(err);
              else nav(next, { replace: true });
            });
          }}
        >
          <Field label="Email">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          </Field>
          <Field label="Password">
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
          </Field>
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
          <Button className="w-full" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</Button>
        </form>
        <div className="mt-4 flex justify-between text-xs font-semibold">
          <Link to="/forgot-password" className="text-ember hover:underline">Forgot password?</Link>
          <Link to={`/register?next=${encodeURIComponent(next)}`} className="hover:underline">Create account</Link>
        </div>
      </div>
    </div>
  );
}
