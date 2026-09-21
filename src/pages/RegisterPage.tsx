import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { Button, Field, Input } from '../components/ui';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="font-display text-3xl font-black">Join DropX</h1>
      <p className="mt-1 text-sm text-ink/60">Early access to drops, faster checkout, order tracking.</p>
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink/5">
        {done ? (
          <div className="text-sm">
            <p className="font-bold">Check your inbox ✉️</p>
            <p className="mt-1 text-ink/60">We sent a verification link to {email}. Click it, then log in.</p>
            <Link to="/login" className="mt-4 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-paper">Go to login</Link>
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
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Aashish Sharma" autoComplete="name" />
            </Field>
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" autoComplete="email" />
            </Field>
            <Field label="Password (min 8 characters)">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" autoComplete="new-password" />
            </Field>
            {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
            <Button className="w-full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</Button>
          </form>
        )}
        <p className="mt-4 text-center text-xs text-ink/60">
          Already have an account? <Link to="/login" className="font-bold text-ember">Log in</Link>
        </p>
      </div>
    </div>
  );
}
