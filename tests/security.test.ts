import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..');

/** Guardrails: security invariants that must hold in the shipped code. */
describe('security invariants', () => {
  it('server .env.example holds ONLY server secrets — no client vars at all', () => {
    const example = readFileSync(join(root, '.env.example'), 'utf8');
    expect(example).not.toMatch(/^\s*VITE_/m);
    expect(example).toContain('SUPABASE_SERVICE_ROLE_KEY=');
    expect(example).not.toMatch(/sk-live|pk-live|BEGIN PRIVATE KEY/);
  });

  it('checkout never self-marks orders paid', () => {
    const checkout = readFileSync(join(root, 'src/pages/CheckoutPage.tsx'), 'utf8');
    expect(checkout).not.toMatch(/payment_status['"]?\s*:\s*['"]paid/);
    expect(checkout).toMatch(/never.*paid|verified/i);
  });

  it('RLS migration enables row level security on all core tables', () => {
    const rls = readFileSync(join(root, 'supabase/migrations/002_rls.sql'), 'utf8');
    for (const t of ['products', 'orders', 'order_items', 'profiles', 'cart_items', 'reviews', 'drops']) {
      expect(rls).toContain(`alter table public.${t} enable row level security`);
    }
  });

  it('place_order recomputes totals server-side and records the offline method', () => {
    const fn = readFileSync(join(root, 'supabase/migrations/003_functions.sql'), 'utf8');
    expect(fn).toContain('create or replace function public.place_order');
    expect(fn).toContain('for update');
    expect(fn).toContain('Insufficient stock');
    expect(fn).toContain('p_payment_provider');
  });
});
