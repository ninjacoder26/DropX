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
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ember">Legal</p>
      <h1 className="mt-1 font-display text-4xl font-black tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-ink/60">Last updated: October 2026 · DropX — online store, Imadol, Lalitpur, Nepal</p>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink/5 md:p-8">
        <div className="rounded-2xl bg-ember/10 p-4 text-sm leading-relaxed ring-1 ring-ember/20">
          <p className="font-display font-extrabold">The short version</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-ink/70">
            <li>Online-only shop — no physical store. Cash on Delivery, Kathmandu Valley only.</li>
            <li>Pending orders cancel in one tap; unworn items get 7-day size exchanges.</li>
            <li>Our photos and text are ours — please don&apos;t reuse them. Report image issues and we act fast.</li>
            <li>Small independent business, not a registered company (more in §1).</li>
          </ul>
        </div>

        <Section title="1. Who we are">
          <p>
            DropX (“we”, “our”) is a small independent <strong>online-only store</strong> run from Imadol,
            Lalitpur — there is no physical shop to visit; everything happens on this website. We are{' '}
            <strong>not currently registered as a company</strong> with the Office of the Company Registrar and
            hold no VAT/PAN registration, so our receipts are order confirmations, not tax invoices, and prices
            are exactly as marked with no hidden charges. By placing an order you agree to these terms.
          </p>
        </Section>
        <Section title="2. Products & pricing">
          <p>All prices are final prices in Nepalese Rupees (NPR) — what you see is what you pay, plus the delivery fee shown at checkout. Product colours may vary slightly from photos due to screens and lighting. Limited “drop” items are sold while stock lasts; if an item becomes unavailable after checkout we cancel that part of the order and you simply don&apos;t pay for it.</p>
        </Section>
        <Section title="3. Orders & checkout">
          <p>An order is confirmed when you see an order number. Prices, stock and delivery coverage are re-verified by our system at order time — if a price was displayed incorrectly, we will contact you before dispatch and you may cancel. You can cancel any <strong>pending</strong> order yourself from its order page (a reason is required so we can improve); once we start preparing it, cancellation needs our help — just email us.</p>
        </Section>
        <Section title="4. Payments">
          <p>We accept <strong>Cash on Delivery only</strong> — you pay in cash when your order arrives. We take no online card or wallet payments on this website, so no payment details ever touch our servers.</p>
        </Section>
        <Section title="5. Delivery">
          <p>We currently deliver inside <strong>Kathmandu Valley only</strong> (Kathmandu, Lalitpur and Bhaktapur), priced from our Imadol hub with per-plan base fees plus a per-kilometre rate — standard (3–5 days), express (1–3 days), with free standard shipping over the threshold shown at checkout. Exact fees are always shown before you pay. Risk passes to you on delivery; please inspect items on arrival.</p>
        </Section>
        <Section title="6. Exchanges">
          <p>Unworn items with tags attached can be exchanged for a different size within <strong>7 days of delivery</strong>, subject to stock. Items worn, washed, altered or damaged after delivery cannot be exchanged. To start one, contact dropx.nepal@gmail.com with your order number.</p>
        </Section>
        <Section title="7. Accounts & reviews">
          <p>You are responsible for activity under your account and for keeping your password confidential. We may suspend accounts used for fraud, abuse or repeated payment refusal on delivery. Reviews must be your own genuine experience — no fake, paid, or copied reviews. By posting a review you grant us a free licence to display it on the store (without your email, which is never shown).</p>
        </Section>
        <Section title="8. Our content is ours">
          <p>Everything on this site that we created — product photos, descriptions, graphics, the DropX name and logo, page design and text — belongs to DropX and is protected by copyright. You may view it while shopping, but you may not copy, download for commercial use, reproduce, or redistribute it without our prior written permission. Short personal sharing (e.g. sending a product link to a friend) is always fine.</p>
        </Section>
        <Section title="9. Image reports & removals">
          <p>If you own the rights to a product photo we display, report it from the product page (brand name, contact email, which image, why) or email dropx.nepal@gmail.com. A human reviews every report: genuinely disputed photos are hidden from the storefront while we verify, and removed where the claim holds. False or abusive reports may lead to suspension. If your own content was removed and you believe that was wrong, reply with proof of rights and we will restore it promptly.</p>
        </Section>
        <Section title="10. Acceptable use">
          <p>You agree not to misuse the store (fake orders, payment fraud, scraping, copying our catalogue, or interfering with other customers). We may cancel orders and suspend accounts that breach these terms, with a recorded reason.</p>
        </Section>
        <Section title="11. Running this store right">
          <p>We operate in good faith under the laws of Nepal, including the Electronic Transactions Act and consumer-protection rules as they apply to online retail: honest listings, honoured prices, real stock, and prompt handling of complaints. If any authority makes a lawful request about an order or account, we comply as the law requires. If you are a rights-holder, customer, or official with a concern, contacting us first at dropx.nepal@gmail.com gets the fastest resolution — most issues end there, without anyone needing lawyers.</p>
        </Section>
        <Section title="12. If something still goes wrong">
          <p>Talk to us first and we will make it right with a replacement or exchange. If we cannot agree, disputes are settled by good-faith negotiation under the laws of Nepal. Our responsibility for any order is limited to what you paid for it.</p>
        </Section>
        <Section title="13. Changes & contact">
          <p>We may update these terms; the version at order time applies to your purchase. Questions: dropx.nepal@gmail.com.</p>
        </Section>
      </div>
      <p className="mt-6 text-center text-sm">
        <Link to="/privacy" className="font-bold text-ember hover:underline">Read our Privacy Policy →</Link>
      </p>
    </div>
  );
}
