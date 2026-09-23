// POST /functions/v1/notify-order  { "order_id": "<uuid>" }
//
// Sends the admin a Brevo email about a freshly placed DropX order.
// Brevo is free (300 emails/day, no card) and needs no custom domain —
// any mailbox you own (e.g. your Gmail) works as the sender after a
// one-click verification in the Brevo dashboard.
// Called from CheckoutPage AFTER place_order() succeeds — the order already
// exists (idempotent RPC), so this can never duplicate or block an order.
// Email failures return 5xx for the function logs but never touch the order.
//
// Secrets (Supabase dashboard → Edge Functions → Secrets, or CLI):
//   BREVO_API_KEY  Brevo SMTP API key (Settings → SMTP & API → API keys)
//   ADMIN_EMAIL    where the notification goes (e.g. dropx.nepal@gmail.com)
//   FROM_EMAIL     your verified Brevo sender (can be the same Gmail address)
//   FROM_NAME      sender name, e.g. "DropX Orders" (optional)
//   SITE_URL       e.g. https://dropx.vercel.app (optional, adds dashboard link)
// SUPABASE_URL / SUPABASE_ANON_KEY are provided by Supabase automatically.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildOrderEmail } from './email.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { emailed: false, error: 'POST only.' });
  try {
    const url = Deno.env.get('SUPABASE_URL') ?? '';
    const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const apiKey = Deno.env.get('BREVO_API_KEY') ?? '';
    const adminEmail = Deno.env.get('ADMIN_EMAIL') ?? '';
    const fromEmail = Deno.env.get('FROM_EMAIL') ?? '';
    if (!url || !anon) return json(500, { emailed: false, error: 'Supabase config missing.' });
    if (!apiKey || !adminEmail || !fromEmail) {
      console.error('[notify-order] email secrets missing');
      return json(500, { emailed: false, error: 'Email not configured.' });
    }

    let body: unknown = {};
    try {
      body = await req.json();
    } catch {
      return json(400, { emailed: false, error: 'Invalid JSON body.' });
    }
    const orderId = (body as { order_id?: unknown }).order_id;
    if (typeof orderId !== 'string' || orderId.trim() === '') {
      return json(400, { emailed: false, error: 'order_id required.' });
    }

    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!token) return json(401, { emailed: false, error: 'Sign-in required.' });
    const sb = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const {
      data: { user },
      error: userErr,
    } = await sb.auth.getUser();
    if (userErr || !user) return json(401, { emailed: false, error: 'Sign-in required.' });

    // Owner-only read (RLS enforces this too) — a caller can only notify
    // about their own order, never anyone else's.
    const { data: order, error: orderErr } = await sb
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();
    if (orderErr || !order) {
      console.error('[notify-order] order not found', { orderId });
      return json(404, { emailed: false, error: 'Order not found.' });
    }

    const fromName = Deno.env.get('FROM_NAME') || 'DropX Orders';
    const site = (Deno.env.get('SITE_URL') ?? '').replace(/\/$/, '');
    const { subject, html, text } = buildOrderEmail(
      order as never,
      site ? { dashboardUrl: `${site}/admin` } : undefined
    );

    // Official Brevo send API: https://developers.brevo.com/docs/send-a-transactional-email
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: adminEmail }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });
    if (!res.ok) {
      // Log status + order id only — provider bodies can echo customer PII.
      console.error('[notify-order] brevo rejected', { orderId, status: res.status });
      return json(502, { emailed: false, error: 'Email provider rejected the message.' });
    }
    const sent = (await res.json().catch(() => ({}))) as { messageId?: string };
    console.log('[notify-order] sent', { orderId, emailId: sent.messageId ?? null });
    return json(200, { emailed: true });
  } catch (e) {
    console.error('[notify-order] unexpected', e instanceof Error ? e.message : 'unknown');
    return json(500, { emailed: false, error: 'Notification failed.' });
  }
});
