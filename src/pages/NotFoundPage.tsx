import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="font-display text-7xl font-black text-ember">404</p>
      <h1 className="mt-2 font-display text-2xl font-black">Lost in the drop?</h1>
      <p className="mt-2 text-sm text-ink/60">That page does not exist. Let us get you back to the good stuff.</p>
      <Link to="/" className="mt-6 inline-block rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-paper">
        Back home
      </Link>
    </div>
  );
}
