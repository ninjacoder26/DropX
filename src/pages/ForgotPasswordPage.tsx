import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { Button, Field, Input } from '../components/ui';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="font-display text-3xl font-black">Reset password</h1>
      <p className="mt-1 text-sm text-ink/60">We will email you a recovery link.</p>
      <form
        className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink/5"
        onSubmit={(e) => {
          e.preventDefault();
          setBusy(true);
          setMsg(null);
          void resetPassword(email.trim()).then(({ error }) => {
            setBusy(false);
            setMsg(error ?? 'If an account exists for that email, a recovery link is on its way.');
          });
        }}
      >
        <Field label="Email">
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        {msg && <p className="rounded-xl bg-paper-dark px-3 py-2 text-xs">{msg}</p>}
        <Button className="w-full" disabled={busy}>{busy ? 'Sending…' : 'Send recovery link'}</Button>
        <p className="text-center text-xs"><Link to="/login" className="font-bold text-ember">Back to login</Link></p>
      </form>
    </div>
  );
}
