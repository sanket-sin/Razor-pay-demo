import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useCreatorProfile } from '../hooks/useCreatorProfile.js';
import * as creatorsApi from '../services/creators.js';
import { getErrorMessage } from '../services/api.js';
import Alert from '../components/Alert.jsx';

export default function CreatorDashboard() {
  const user = useAuthStore((s) => s.user);
  const { creatorId } = useCreatorProfile();
  const [creator, setCreator] = useState(null);
  const [razorpayAccountId, setRazorpayAccountId] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user?.role !== 'creator') return;
    creatorsApi.getCreatorMe().then((data) => {
      setCreator(data);
      setRazorpayAccountId(data?.razorpayLinkedAccountId || '');
    }).catch(() => {});
  }, [user?.role]);

  const handleSaveConnector = async (e) => {
    e.preventDefault();
    setErr('');
    setSaved(false);
    setSaving(true);
    try {
      const updated = await creatorsApi.updateCreatorMe({ razorpayLinkedAccountId: razorpayAccountId.trim() || null });
      setCreator(updated);
      setRazorpayAccountId(updated?.razorpayLinkedAccountId || '');
      setSaved(true);
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Creator dashboard</h1>
      <p className="mt-1 text-slate-400">Logged in as {user?.name}</p>
      {!creatorId && (
        <p className="mt-2 text-sm text-amber-400/90">
          Create your first session to link this dashboard to your creator profile.
        </p>
      )}

      {user?.role === 'creator' && (
        <div className="mt-8 card border-ink-600 max-w-xl">
          <h2 className="font-display font-semibold text-white">Payment account (connector)</h2>
          <p className="mt-1 text-sm text-slate-400">
            Link your Razorpay account so you receive payouts. Create a linked account in Razorpay Dashboard (Route) and paste the account ID below.
          </p>
          {err && <Alert onDismiss={() => setErr('')} className="mt-3">{err}</Alert>}
          {saved && <Alert type="info" onDismiss={() => setSaved(false)} className="mt-3">Saved.</Alert>}
          <form onSubmit={handleSaveConnector} className="mt-4 flex flex-wrap gap-2 items-end">
            <input
              className="input flex-1 min-w-[200px]"
              placeholder="Razorpay linked account ID (e.g. acc_...)"
              value={razorpayAccountId}
              onChange={(e) => setRazorpayAccountId(e.target.value)}
            />
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </form>
        </div>
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
