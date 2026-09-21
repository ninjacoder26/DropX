import { Link } from 'react-router-dom';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-extrabold">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-ink/70">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ember">Legal</p>
      <h1 className="mt-1 font-display text-4xl font-black tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-ink/60">Last updated: September 2026 · DropX, Kathmandu, Nepal</p>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink/5 md:p-8">
        <Section title="1. Who we are">
          <p>
            DropX (“we”, “our”) operates the online store at this website, selling apparel, footwear and
            accessories across Nepal. By placing an order you agree to these terms.
          </p>
        </Section>
        <Section title="2. Products & pricing">
          <p>All prices are in Nepalese Rupees (NPR) and include applicable taxes. Product colours may vary slightly from photos due to screens and lighting. Limited “drop” items are sold while stock lasts; we may cancel an order and refund you if an item becomes unavailable after checkout.</p>
        </Section>
        <Section title="3. Orders & checkout">
          <p>An order is confirmed when you see an order number and receive confirmation. Prices and stock are re-verified by our system at order time — if a price was displayed incorrectly, we will contact you before dispatch and you may cancel for a full refund of any amount paid.</p>
        </Section>
        <Section title="4. Payments">
          <p>We accept <strong>Cash on Delivery</strong> and <strong>manual bank transfer</strong>. For bank transfers, our team shares the account details by phone and ships only after the receipt is verified. We take no online card or wallet payments on this website.</p>
        </Section>
        <Section title="5. Delivery">
          <p>Standard delivery takes 2–5 business days across Nepal (remote areas may take longer). Standard shipping is NPR 99, express NPR 199, and standard shipping is free on orders over NPR 2,999. Risk passes to you on delivery; please inspect items on arrival.</p>
        </Section>
        <Section title="6. Exchanges & returns">
          <p>Unworn items with tags attached can be exchanged for a different size within <strong>7 days of delivery</strong>. Exchanges are subject to stock availability. Items worn, washed, altered or damaged after delivery cannot be exchanged. To start an exchange, contact support@dropx.com.np with your order number.</p>
        </Section>
        <Section title="7. Accounts">
          <p>You are responsible for activity under your account and for keeping your password confidential. We may suspend accounts used for fraud, abuse or repeated payment refusal on delivery.</p>
        </Section>
        <Section title="8. Acceptable use">
          <p>You agree not to misuse the store (fake orders, payment fraud, scraping, or interfering with other customers). We may cancel orders that breach these terms.</p>
        </Section>
        <Section title="9. Liability">
          <p>To the maximum extent permitted by the laws of Nepal, our liability for any order is limited to the amount you paid for that order. Nothing here limits rights you hold under Nepalese consumer law.</p>
        </Section>
        <Section title="10. Changes & contact">
          <p>We may update these terms; the version at order time applies to your purchase. Questions: support@dropx.com.np.</p>
        </Section>
      </div>
      <p className="mt-6 text-center text-sm">
        <Link to="/privacy" className="font-bold text-ember hover:underline">Read our Privacy Policy →</Link>
      </p>
    </div>
  );
}
