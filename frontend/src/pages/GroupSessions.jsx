import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as groupApi from '../services/groupSessions.js';
import { getErrorMessage } from '../services/api.js';
import { useAuthStore } from '../store/authStore.js';
import { formatMoney } from '../utils/money.js';
import Spinner from '../components/Spinner.jsx';
import Alert from '../components/Alert.jsx';
import StripeCheckout from '../components/StripeCheckout.jsx';

export default function GroupSessions() {
  const token = useAuthStore((s) => s.token);
  const isBuyer = useAuthStore((s) => s.user?.role === 'buyer');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [pay, setPay] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await groupApi.listGroupSessions({});
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const join = async (id) => {
    setErr('');
    try {
      const res = await groupApi.joinGroupSession(id, 'stripe');
      setPay({ clientSecret: res.clientSecret, paymentId: res.paymentId });
    } catch (e) {
      setErr(getErrorMessage(e));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Group sessions</h1>
      <p className="mt-1 text-slate-400">Full program purchase — limited seats per cohort.</p>
      {err && (
        <div className="mt-4">
          <Alert onDismiss={() => setErr('')}>{err}</Alert>
        </div>
      )}
      <div className="mt-8 space-y-4">
        {list.length === 0 && <p className="text-slate-500">No group sessions yet.</p>}
        {list.map((g) => (
          <div key={g.id} className="card border-ink-600">
            <h2 className="font-semibold text-white">{g.title}</h2>
            <p className="text-sm text-slate-400">
              {g.startDate} → {g.endDate} · Daily window (minutes) {g.dailyStartMinute}–{g.dailyEndMinute} ·{' '}
              {g.sessionTz}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              {formatMoney(g.priceAmount, g.currency)} · max {g.maxParticipants} participants
            </p>
            {token && isBuyer ? (
              <button type="button" className="btn-primary mt-4" onClick={() => join(g.id)}>
                Join & pay
              </button>
            ) : (
              <Link to="/login" className="btn-secondary mt-4 inline-block">
                Log in as buyer to join
              </Link>
            )}
          </div>
        ))}
      </div>
      {pay && (
        <StripeCheckout
          clientSecret={pay.clientSecret}
          paymentId={pay.paymentId}
          onSuccess={() => {
            setPay(null);
            load();
          }}
          onClose={() => setPay(null)}
        />
      )}
    </div>
  );
}
