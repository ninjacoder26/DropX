/**
 * Cash on Delivery — the one and only way to pay on DropX.
 *
 * There is no online payment integration in this build, on purpose:
 * no provider credentials, no redirects, no webhooks, no simulated success
 * screens. The courier collects cash at the door; an admin marks the order
 * `paid` in the dashboard afterwards.
 *
 * RULE: an order becomes `paid` only through the `mark_order_paid()` RPC,
 * called by an admin with a verified reference. The storefront never marks
 * anything paid, and place_order() rejects any other payment method.
 */

export type PaymentMethod = 'cod';

export interface PaymentMethodInfo {
  method: PaymentMethod;
  label: string;
  hint: string;
}

export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  {
    method: 'cod',
    label: 'Cash on Delivery',
    hint: 'Pay in cash when your order arrives. Available inside Kathmandu Valley: Kathmandu, Lalitpur and Bhaktapur.',
  },
];
