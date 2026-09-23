// Pure order-email builder — no external imports so it runs in Deno
// (Edge Function) and under vitest unchanged.

export interface NotifyOrderItem {
  product_name: string;
  variant_name: string | null;
  quantity: number;
  line_total: number | string;
}

export interface NotifyOrder {
  id: string;
  order_number: string;
  placed_at: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_province: string;
  shipping_city: string;
  shipping_street: string;
  shipping_postal: string | null;
  shipping_method: string;
  subtotal: number | string;
  shipping_fee: number | string;
  grand_total: number | string;
  notes: string;
  items: NotifyOrderItem[];
}

export function escapeHtml(raw: string | null | undefined): string {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function npr(value: number | string): string {
  const n = Number(value);
  return `NPR ${(Number.isFinite(n) ? Math.round(n) : 0).toLocaleString('en-NP')}`;
}

export function orderMoment(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? String(iso)
    : d.toLocaleString('en-NP', { dateStyle: 'medium', timeStyle: 'short' });
}

export function buildOrderEmail(
  order: NotifyOrder,
  opts?: { dashboardUrl?: string }
): { subject: string; html: string; text: string } {
  const items = order.items ?? [];
  const itemCount = items.reduce((s, i) => s + Number(i.quantity ?? 0), 0);
  const subject = `New DropX order ${order.order_number} — ${npr(order.grand_total)} (COD)`;

  const rows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;">${escapeHtml(i.product_name)}${
          i.variant_name ? `<br><span style="color:#888;font-size:12px;">${escapeHtml(i.variant_name)}</span>` : ''
        }</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center;">${Number(i.quantity ?? 0)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right;">${escapeHtml(npr(i.line_total))}</td>
      </tr>`
    )
    .join('');

  const address = escapeHtml(
    [order.shipping_street, order.shipping_city, order.shipping_province, order.shipping_postal]
      .filter((p) => p && String(p).trim() !== '')
      .join(', ')
  );

  const html = `
  <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#101010;">
    <div style="background:#F06427;color:#fff;padding:14px 20px;border-radius:12px 12px 0 0;">
      <strong style="font-size:18px;">New order ${escapeHtml(order.order_number)}</strong>
      <div style="font-size:13px;opacity:.9;">${escapeHtml(orderMoment(order.placed_at))} · ${itemCount} item${itemCount === 1 ? '' : 's'} · Cash on Delivery</div>
    </div>
    <div style="border:1px solid #eee;border-top:0;border-radius:0 0 12px 12px;padding:18px 20px;">
      <p style="margin:0 0 4px;"><strong>Customer:</strong> ${escapeHtml(order.shipping_name)} · ${escapeHtml(order.shipping_phone)}</p>
      <p style="margin:0 0 12px;"><strong>Deliver to:</strong> ${address} <span style="color:#888;">(${escapeHtml(order.shipping_method)})</span></p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr style="text-align:left;color:#666;font-size:12px;text-transform:uppercase;">
          <th style="padding:6px 10px;">Item</th><th style="padding:6px 10px;text-align:center;">Qty</th><th style="padding:6px 10px;text-align:right;">Total</th>
        </tr>
        ${rows}
      </table>
      <p style="margin:12px 0 0;font-size:14px;">Subtotal: ${escapeHtml(npr(order.subtotal))}<br>
      Shipping: ${escapeHtml(npr(order.shipping_fee))}<br>
      <strong style="font-size:16px;">Grand total: ${escapeHtml(npr(order.grand_total))}</strong></p>
      ${
        order.notes && order.notes.trim() !== ''
          ? `<p style="margin:12px 0 0;font-size:13px;color:#555;"><strong>Note:</strong> ${escapeHtml(order.notes)}</p>`
          : ''
      }
      <p style="margin:12px 0 0;font-size:12px;color:#888;">Order ID: ${escapeHtml(order.id)}</p>
      ${
        opts?.dashboardUrl
          ? `<p style="margin:10px 0 0;"><a href="${escapeHtml(opts.dashboardUrl)}" style="background:#101010;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:bold;">Open admin dashboard</a></p>`
          : ''
      }
    </div>
  </div>`;

  const text = [
    `New DropX order ${order.order_number} — ${npr(order.grand_total)} (COD)`,
    `Time: ${orderMoment(order.placed_at)}`,
    `Customer: ${order.shipping_name} · ${order.shipping_phone}`,
    `Deliver to: ${[order.shipping_street, order.shipping_city, order.shipping_province, order.shipping_postal].filter((p) => p && String(p).trim() !== '').join(', ')} (${order.shipping_method})`,
    '',
    ...items.map(
      (i) => `• ${i.product_name}${i.variant_name ? ` (${i.variant_name})` : ''} × ${i.quantity} — ${npr(i.line_total)}`
    ),
    '',
    `Subtotal: ${npr(order.subtotal)}`,
    `Shipping: ${npr(order.shipping_fee)}`,
    `Grand total: ${npr(order.grand_total)}`,
    order.notes && order.notes.trim() !== '' ? `Note: ${order.notes}` : '',
    `Order ID: ${order.id}`,
  ]
    .filter((l) => l !== '')
    .join('\n');

  return { subject, html, text };
}
