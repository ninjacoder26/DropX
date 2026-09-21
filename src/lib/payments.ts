/**
 * Offline payment methods — DropX takes NO online payments.
 *
 * There is no eSewa / Khalti / card integration in this build, on purpose:
 * no provider credentials, no redirects, no webhooks, no simulated success
 * screens. Orders are paid in person (cash) or confirmed manually by an
 * admin after a bank transfer receipt is verified.
 *
 * RULE: an order becomes `paid` only through the `mark_order_paid()` RPC,
 * called by an admin (or service-role automation) with a verified reference.
 * The storefront never marks anything paid.
 */

export type PaymentMethod = 'cod' | 'bank_transfer';

export interface PaymentMethodInfo {
  method: PaymentMethod;
  label: string;
  hint: string;
}

export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  {
    method: 'cod',
    label: 'Cash on Delivery',
    hint: 'Pay in cash when your order arrives. Available across the Kathmandu Valley and major cities.',
  },
  {
    method: 'bank_transfer',
    label: 'Bank Transfer (manual)',
    hint: 'We will call you with the store account details after you order. Your order ships once our team verifies the receipt.',
  },
];
