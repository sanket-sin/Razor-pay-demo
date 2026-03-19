import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

export default function Home() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-16">
      <section className="text-center pt-8 pb-4">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-accent">Sessions · Groups · Products</p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Book creators. <span className="text-accent">Ship products.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-400">
          1:1 time slots, multi-day group programs, and physical goods — with secure checkout.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/book" className="btn-primary px-6">
            Find a session
          </Link>
          <Link to="/products" className="btn-secondary px-6">
            Browse shop
          </Link>
          {!user && (
            <Link to="/register" className="btn-ghost px-6">
              Create account
            </Link>
          )}
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {[
          { t: '1:1 slots', d: 'Pick a slot; one booking per day. Live calendar & availability.' },
          { t: 'Group sessions', d: 'Multi-day cohorts with capped seats.' },
          { t: 'Products', d: 'Regional delivery, stock-aware checkout.' },
        ].map((x) => (
          <div key={x.t} className="card border-ink-600">
            <h3 className="font-display font-semibold text-white">{x.t}</h3>
            <p className="mt-2 text-sm text-slate-400">{x.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
