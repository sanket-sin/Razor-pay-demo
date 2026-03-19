import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useCreatorProfile } from '../hooks/useCreatorProfile.js';

export default function CreatorDashboard() {
  const user = useAuthStore((s) => s.user);
  const { creatorId } = useCreatorProfile();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Creator dashboard</h1>
      <p className="mt-1 text-slate-400">Logged in as {user?.name}</p>
      {!creatorId && (
        <p className="mt-2 text-sm text-amber-400/90">
          Create your first session to link this dashboard to your creator profile.
        </p>
      )}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/creator/session/new" className="card border-ink-600 hover:border-accent/40 transition">
          <h2 className="font-display font-semibold text-white">New 1:1 session</h2>
          <p className="mt-2 text-sm text-slate-400">Date, time window, slot length, price.</p>
        </Link>
        <Link to="/creator/group/new" className="card border-ink-600 hover:border-accent/40 transition">
          <h2 className="font-display font-semibold text-white">New group session</h2>
          <p className="mt-2 text-sm text-slate-400">Date range, daily hours, capacity.</p>
        </Link>
        <Link to="/creator/product/new" className="card border-ink-600 hover:border-accent/40 transition">
          <h2 className="font-display font-semibold text-white">New product</h2>
          <p className="mt-2 text-sm text-slate-400">Price, stock, delivery regions.</p>
        </Link>
        <Link to="/book" className="card border-ink-600 hover:border-accent/40 transition">
          <h2 className="font-display font-semibold text-white">Public booking page</h2>
          <p className="mt-2 text-sm text-slate-400">Preview how buyers see sessions.</p>
        </Link>
      </div>
    </div>
  );
}
