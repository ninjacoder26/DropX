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
      <p className="mt-2 text-sm text-ink/60">Last updated: October 2026 · DropX — online store, Imadol, Lalitpur, Nepal</p>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink/5 md:p-8">
        <div className="rounded-2xl bg-ember/10 p-4 text-sm leading-relaxed ring-1 ring-ember/20">
          <p className="font-display font-extrabold">The short version</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-ink/70">
            <li>We collect what an order needs — contact, address, order history — and nothing to sell.</li>
            <li>No card or wallet details ever touch our servers (Cash on Delivery only).</li>
            <li>Cancelled and delivered orders auto-delete after 7 days.</li>
            <li>Your reviews and reports are handled by humans, never sold, never shared for marketing.</li>
          </ul>
        </div>

        <Section title="1. Who holds your data">
          <p>
            DropX is a small independent <strong>online-only</strong> shop run from Imadol, Lalitpur — there is
            no physical store. It is <strong>not currently a registered company</strong>. Your data is held by
            us for running the store — there is no parent company and no data broker involved. Contact for
            anything privacy-related: dropx.nepal@gmail.com.
          </p>
        </Section>
        <Section title="2. What we collect — and why">
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Account details</strong> (name, email, phone, password hash via our auth provider) — to run your account and log you in.</li>
            <li><strong>Delivery addresses</strong> — to ship your orders. Nothing else.</li>
            <li><strong>Order contents & history</strong> — to fulfil, track and support your purchases.</li>
            <li><strong>Reviews & wishlist</strong> — only what you explicitly submit or save. Approved reviews appear publicly with your review text, never your email. Posting a review gives us a free licence to display it on the store.</li>
            <li><strong>Profile photo</strong> (optional) — stored only if you upload one.</li>
            <li><strong>Browsing signals</strong> (product views, searches, wishlist/cart actions, anonymised per session) — to power recommendations and see which products are wanted.</li>
            <li><strong>Image-ownership reports</strong> (brand name, contact email, disputed image, reason) — only if you file one, so a human can review it and reply to you.</li>
            <li><strong>Device basics</strong> (login session, guest bag, wishlist, recently viewed, stored on your own device) — to keep things working between visits.</li>
          </ul>
          <p>We do <strong>not</strong> collect card numbers, wallet credentials, location tracking, or advertising profiles. There is no online payment on this site, so payment details never touch our servers.</p>
        </Section>
        <Section title="3. How we use it">
          <p>Your data is used to process orders, deliver parcels, confirm cash payments, prevent fraud, handle cancellations, exchanges and image reports, and improve the store. We do not sell your personal data, and we do not share it with advertisers.</p>
        </Section>
        <Section title="4. Who sees it">
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Our delivery team</strong> — name, phone and address for your parcel.</li>
            <li><strong>Store staff</strong> — a small photo team can view store data to manage product images; they can change nothing else, and every admin action is logged.</li>
            <li><strong>Service providers</strong> — Supabase (database and login hosting), Cloudinary (product image delivery), and Google (only if you choose Google login) process data on our behalf under their own security standards.</li>
            <li><strong>Nobody else</strong> — we do not sell data, rent lists, or share your details for marketing. Ever.</li>
          </ul>
        </Section>
        <Section title="5. Lawful requests">
          <p>We operate openly under the laws of Nepal and keep the minimum data needed to run the shop — which keeps everyone safer. Personal data is disclosed to authorities only where the law genuinely requires it, and where lawful we tell the affected customer first. Routine business records (like delivery addresses on active orders) are never volunteered; marketing or fishing requests are refused outright.</p>
        </Section>
        <Section title="6. How it is protected">
          <p>Access is gated by database-level permissions (Row Level Security): customers can only see their own orders and addresses; only authorised team accounts can see store data, photo staff get the minimum possible access, and every admin action is logged. Traffic is encrypted in transit (HTTPS).</p>
        </Section>
        <Section title="7. How long we keep it">
          <p>Cancelled and successfully delivered orders are <strong>permanently deleted 7 days</strong> after completion, along with their line items. Image-ownership reports are kept while the dispute is open plus a reasonable records period, then removed. Active-order and account data is kept while your account exists so we can support purchases, exchanges and reorders. You may ask us to delete your account and profile data at any time.</p>
        </Section>
        <Section title="8. Your rights">
          <p>You can view and edit your profile and addresses in <Link to="/account" className="font-bold text-ember">My account</Link>, and request a copy, correction or deletion of your data at dropx.nepal@gmail.com. We respond within 15 days.</p>
        </Section>
        <Section title="9. Cookies & local storage">
          <p>We use essential browser storage only: your login session, guest bag, wishlist and recently-viewed items. No third-party advertising or cross-site tracking cookies.</p>
        </Section>
        <Section title="10. Children">
          <p>DropX is not directed at children under 13. Accounts for minors should be managed by a parent or guardian.</p>
        </Section>
        <Section title="11. Changes & contact">
          <p>Material changes will be announced on this page with a new date. Privacy questions: dropx.nepal@gmail.com.</p>
        </Section>
      </div>
      <p className="mt-6 text-center text-sm">
        <Link to="/terms" className="font-bold text-ember hover:underline">Read our Terms of Service →</Link>
      </p>
    </div>
  );
}
