import { Link } from 'react-router-dom';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-extrabold">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-ink/70">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ember">Legal</p>
      <h1 className="mt-1 font-display text-4xl font-black tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-ink/60">Last updated: September 2026 · DropX, Kathmandu, Nepal</p>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink/5 md:p-8">
        <Section title="1. What we collect — and why">
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Account details</strong> (name, email, phone, password hash via our auth provider) — to run your account and log you in.</li>
            <li><strong>Delivery addresses</strong> — to ship your orders. Nothing else.</li>
            <li><strong>Order contents & history</strong> — to fulfil, track and support your purchases.</li>
            <li><strong>Reviews & wishlist</strong> — only what you explicitly submit or save.</li>
            <li><strong>Profile photo</strong> (optional) — stored only if you upload one.</li>
            <li><strong>Device basics</strong> (cart contents on your own device) — to keep your bag between visits.</li>
          </ul>
          <p>We do <strong>not</strong> collect card numbers, wallet credentials, location tracking, or advertising profiles. There is no online payment on this site, so payment details never touch our servers.</p>
        </Section>
        <Section title="2. How we use it">
          <p>Your data is used to process orders, deliver parcels, confirm payments (cash/bank), prevent fraud, and improve the store. We do not sell your personal data, and we do not share it with advertisers.</p>
        </Section>
        <Section title="3. Who sees it">
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Our delivery team</strong> — name, phone and address for your parcel.</li>
            <li><strong>Service providers</strong> — Supabase (database/auth hosting) and Cloudinary (product image delivery) process data on our behalf under their own security standards.</li>
            <li><strong>Authorities</strong> — only when required by the laws of Nepal.</li>
          </ul>
        </Section>
        <Section title="4. How it is protected">
          <p>Access is gated by database-level permissions (Row Level Security): customers can only see their own orders and addresses; only authorised admins can see store data, and every admin action is logged. Traffic is encrypted in transit (HTTPS).</p>
        </Section>
        <Section title="5. How long we keep it">
          <p>Order records are kept as required for accounting and warranty support. You may ask us to delete your account and marketing-free profile data at any time (completed-order invoices may be retained for legal records).</p>
        </Section>
        <Section title="6. Your rights">
          <p>You can view and edit your profile and addresses in <Link to="/account" className="font-bold text-ember">My account</Link>, and request a copy, correction or deletion of your data at support@dropx.com.np. We respond within 15 days.</p>
        </Section>
        <Section title="7. Cookies & local storage">
          <p>We use essential browser storage only: your login session, guest bag, wishlist and recently-viewed items. No third-party advertising or cross-site tracking cookies.</p>
        </Section>
        <Section title="8. Children">
          <p>DropX is not directed at children under 13. Accounts for minors should be managed by a parent or guardian.</p>
        </Section>
        <Section title="9. Changes & contact">
          <p>Material changes will be announced on this page with a new date. Privacy questions: support@dropx.com.np.</p>
        </Section>
      </div>
      <p className="mt-6 text-center text-sm">
        <Link to="/terms" className="font-bold text-ember hover:underline">Read our Terms of Service →</Link>
      </p>
    </div>
  );
}
