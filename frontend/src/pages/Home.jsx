import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

export default function Home() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-16">
      <section className="text-center pt-8 pb-4">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-accent">Sessions & products</p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Book creators. <span className="text-accent">Buy their work.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-400">
          See every creator’s 1:1 slots and products in one place — pay once with Razorpay at checkout.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/browse" className="btn-primary px-6">
            Sessions & shop
          </Link>
          {!user && (
            <Link to="/register" className="btn-ghost px-6">
              Create account
            </Link>
          )}
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        {[
          { t: '1:1 sessions', d: 'Choose a slot, pay with Razorpay, get confirmed on the spot.' },
          { t: 'Products', d: 'Open any listing, checkout once, track orders in your account.' },
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
