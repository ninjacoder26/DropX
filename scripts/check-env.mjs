import { existsSync, readFileSync } from 'node:fs';

// Warns (never fails) when server-only env is missing.
// Client values live in src/config.ts, so only server secrets are checked here.
// Vercel builds: set these in Project Settings → Environment Variables.
const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
let env: Record<string, string> = {};
try {
  const raw = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
} catch {
  /* no local .env — rely on process env (CI/Vercel) */
}
const missing = required.filter((k) => !(process.env[k] ?? env[k]));
if (missing.length > 0 && !existsSync(new URL('../.env', import.meta.url))) {
  console.warn(
    `[DropX] Server env not set (${missing.join(', ')}). ` +
      `The storefront still builds and runs; only /api server functions needing these keys are affected.`
  );
}
