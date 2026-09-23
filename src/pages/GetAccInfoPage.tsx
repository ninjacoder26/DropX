import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy } from 'lucide-react';
import { normalizeFullName } from '../lib/staff';
import { Button, Field, Input } from '../components/ui';
import { usePageTitle } from '../hooks/usePageTitle';

interface Revealed {
  username: string;
  password: string;
}

/**
 * Public one-time account lookup for staff. Type your full name exactly as
 * your superadmin entered it — the server matches case-insensitively with
 * spaces tidied — and your login shows ONCE: revealing marks it used, so a
 * refresh never shows it again. The password is copied automatically.
 */
export default function GetAccInfoPage() {
  usePageTitle('Get account info');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState<Revealed | null>(null);
  const [copied, setCopied] = useState(false);

  const copyPass = async (password: string) => {
    try {
      await navigator.clipboard.writeText(password);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = password;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (revealed) {
    return (
      <div className="mx-auto max-w-md px-4 sm:px-6 py-14">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ember">One-time reveal</p>
        <h1 className="mt-1 font-display text-3xl font-black">Your login</h1>
        <p className="mt-1 text-sm text-ink/60">
          Shown once and already locked — refreshing will not show it again. Your password was copied automatically.
        </p>
        <div className="mt-6 space-y-3 rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink/5">
          <div>
            <p className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink/60">Staff username</p>
            <p className="rounded-xl bg-paper px-3.5 py-2.5 font-mono text-sm font-bold">{revealed.username}</p>
          </div>
          <div>
            <p className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink/60">Password</p>
            <p className="break-all rounded-xl bg-ink px-3.5 py-2.5 font-mono text-sm text-paper">{revealed.password}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="dark" className="flex-1" onClick={() => void copyPass(revealed.password)}>
              {copied ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy password</>}
            </Button>
            <Link to="/staff/login" className="flex-1">
              <Button className="w-full">Sign in →</Button>
            </Link>
          </div>
          <p className="text-center text-xs text-ink/50">
            Sign in at <span className="font-mono font-bold">/staff/login</span> with the username + password above.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-14">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ember">DropX staff</p>
      <h1 className="mt-1 font-display text-3xl font-black">Get account info</h1>
      <p className="mt-1 text-sm text-ink/60">
        Type your <strong>full name</strong> exactly as your superadmin entered it — your login shows here one time only.
      </p>
      <form
        className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink/5"
        onSubmit={(e) => {
          e.preventDefault();
          if (normalizeFullName(name).length < 2) {
            setError('Type your full name.');
            return;
          }
          setError(null);
          setBusy(true);
          fetch('/api/staff-manage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'lookup', full_name: name }),
          }).then(
            async (res) => {
              const out = (await res.json().catch(() => ({}))) as {
                ok?: boolean; username?: string; password?: string; error?: string;
              };
              if (!res.ok || !out.ok || !out.username || !out.password) {
                setBusy(false);
                setError(out.error ?? 'Lookup failed — try again.');
                return;
              }
              setRevealed({ username: out.username, password: out.password });
              setBusy(false);
              void copyPass(out.password);
            },
            () => {
              setBusy(false);
              setError('Could not reach the server. Try again.');
            }
          );
        }}
      >
        <Field label="Full name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rojina Sharma" autoComplete="name" maxLength={120} />
        </Field>
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        <Button className="w-full" disabled={busy}>{busy ? 'Looking up…' : 'Show my login'}</Button>
        <p className="text-center text-xs text-ink/50">
          Already have it? <Link to="/staff/login" className="font-bold text-ember">Go to staff login</Link>
        </p>
      </form>
    </div>
  );
}
