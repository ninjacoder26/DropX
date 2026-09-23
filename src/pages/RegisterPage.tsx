import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { AuthShell } from '../components/AuthShell';
import { Button, Field, Input } from '../components/ui';
import { usePageTitle } from '../hooks/usePageTitle';

export default function RegisterPage() {
  const { signUp } = useAuth();
  usePageTitle('Join DropX');
  const [params] = useSearchParams();
  const next = params.get('next');
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : '/login';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <AuthShell
      kicker="New here?"
      title="Join DropX"
      sub="Early access to drops, faster checkout, order tracking."
    >
      {done ? (
        <div className="text-sm">
          <p className="font-display text-lg font-extrabold">Check your inbox ✉️</p>
          <p className="mt-1 text-ink/60">We sent a verification link to {email}. Click it, then log in{next === '/checkout' ? ' to finish checking out — your bag is saved' : ''}.</p>
          <Link to={loginHref} className="mt-4 inline-block rounded-full bg-ink px-6 py-3 text-sm font-bold text-paper">Go to login</Link>
        </div>
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
            setBusy(true);
            void signUp(email.trim(), password, name.trim()).then(({ error: err }) => {
              setBusy(false);
              if (err) setError(err);
              else setDone(true);
            });
          }}
        >
          <Field label="Full name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Aashish Sharma" autoComplete="name" className="!py-3 !text-base" />
          </Field>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" autoComplete="email" className="!py-3 !text-base" />
          </Field>
          <Field label="Password (min 8 characters)">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" autoComplete="new-password" className="!py-3 !text-base" />
          </Field>
          {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
          <Button className="w-full !min-h-[48px] !text-base" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</Button>
        </form>
      )}
      <p className="mt-5 text-center text-sm text-ink/60">
        Already have an account? <Link to={loginHref} className="font-bold text-ember">Log in</Link>
      </p>
    </AuthShell>
  );
}
