import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { AuthShell } from '../components/AuthShell';
import { Button, Field, Input } from '../components/ui';
import { usePageTitle } from '../hooks/usePageTitle';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  usePageTitle('Reset password');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <AuthShell
      kicker="Locked out?"
      title="Reset password"
      sub="We will email you a recovery link."
    >
      <form
        className="space-y-4"
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
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="!py-3 !text-base" />
        </Field>
        {msg && <p className="rounded-xl bg-paper-dark px-3 py-2.5 text-sm">{msg}</p>}
        <Button className="w-full !min-h-[48px] !text-base" disabled={busy}>{busy ? 'Sending…' : 'Send recovery link'}</Button>
        <p className="text-center text-sm"><Link to="/login" className="font-bold text-ember">Back to login</Link></p>
      </form>
    </AuthShell>
  );
}
