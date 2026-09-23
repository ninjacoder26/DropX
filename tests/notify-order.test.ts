import { describe, expect, it } from 'vitest';
import { buildOrderEmail, escapeHtml, npr, type NotifyOrder } from '../supabase/functions/notify-order/email';

const order = (over: Partial<NotifyOrder> = {}): NotifyOrder => ({
  id: '11111111-2222-3333-4444-555555555555',
  order_number: 'DX-2026-0007',
  placed_at: '2026-09-23T10:15:00.000Z',
  shipping_name: 'Aashish Sharma',
  shipping_phone: '9811111111',
  shipping_province: 'Bagmati',
  shipping_city: 'Thamel',
  shipping_street: 'House 1, Lazimpat Road',
  shipping_postal: '44600',
  shipping_method: 'standard',
  subtotal: 2500,
  shipping_fee: 80,
  grand_total: 2580,
  notes: 'Call before arriving',
  items: [
    { product_name: 'Brass Pen', variant_name: 'Black / M', quantity: 2, line_total: 2000 },
    { product_name: 'Notebook', variant_name: null, quantity: 1, line_total: 500 },
  ],
  ...over,
});

describe('notify-order email', () => {
  it('subject carries order number and total', () => {
    const { subject } = buildOrderEmail(order());
    expect(subject).toContain('DX-2026-0007');
    expect(subject).toContain('2,580');
    expect(subject).toContain('COD');
  });

  it('html lists customer, items, quantities and totals', () => {
    const { html } = buildOrderEmail(order(), { dashboardUrl: 'https://shop.test/admin' });
    for (const bit of [
      'Aashish Sharma',
      '9811111111',
      'House 1, Lazimpat Road',
      'Brass Pen',
      'Black / M',
      'Notebook',
      '2,000',
      '2,580',
      'Call before arriving',
      'https://shop.test/admin',
    ]) {
      expect(html).toContain(bit);
    }
    expect(html).not.toMatch(/<script/i);
  });

  it('escapes customer-controlled text', () => {
    const { html, text } = buildOrderEmail(
      order({
        shipping_name: '<img src=x onerror=alert(1)>',
        notes: '<b>hi</b>',
        items: [{ product_name: '<script>steal()</script>', variant_name: null, quantity: 1, line_total: 10 }],
      })
    );
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&lt;script&gt;steal()&lt;/script&gt;');
    expect(html).not.toContain('<script>steal()</script>');
    expect(text).toContain('<img src=x onerror=alert(1)>');
  });

  it('text version carries the same facts without markup', () => {
    const { text } = buildOrderEmail(order());
    expect(text).toContain('DX-2026-0007');
    expect(text).toContain('× 2');
    expect(text).toContain('Grand total: NPR 2,580');
    expect(text).toContain('Order ID: 11111111-2222-3333-4444-555555555555');
    expect(text).not.toContain('<tr>');
  });

  it('handles missing notes, postal and dashboard link', () => {
    const { html, text } = buildOrderEmail(order({ notes: '', shipping_postal: null }));
    expect(html).not.toContain('Note:');
    expect(html).not.toContain('admin');
    expect(text).not.toContain('Note:');
  });

  it('npr and escapeHtml behave', () => {
    expect(npr(2580)).toBe('NPR 2,580');
    expect(npr('abc')).toBe('NPR 0');
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml('a&b')).toBe('a&amp;b');
  });
});
