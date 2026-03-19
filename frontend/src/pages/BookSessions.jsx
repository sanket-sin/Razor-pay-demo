import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import * as sessionsApi from '../services/sessions.js';
import { getErrorMessage } from '../services/api.js';
import { useAuthStore } from '../store/authStore.js';
import { formatMoney } from '../utils/money.js';
import Spinner from '../components/Spinner.jsx';
import Alert from '../components/Alert.jsx';
import StripeCheckout from '../components/StripeCheckout.jsx';

function formatSlotTime(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return iso;
  }
}

export default function BookSessions() {
  const token = useAuthStore((s) => s.token);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [pay, setPay] = useState(null);

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await sessionsApi.listSessions({});
      setSessions(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sorted = useMemo(
    () =>
      [...sessions].sort((a, b) => String(a.sessionDate).localeCompare(String(b.sessionDate))),
    [sessions]
  );

  const book = async (slotId) => {
    if (!token) return;
    setErr('');
    try {
      const res = await sessionsApi.bookSlot(slotId, 'stripe');
      setPay({
        clientSecret: res.clientSecret,
        paymentId: res.paymentId,
      });
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
      <h1 className="font-display text-2xl font-bold text-white">Book a session</h1>
      <p className="mt-1 text-slate-400">Choose an available slot. You can book one individual slot per UTC day.</p>

      {!token && (
        <Alert type="info" className="mt-4">
          <span className="text-slate-300">
            <Link to="/login" className="text-accent underline">
              Log in
            </Link>{' '}
            as a buyer to book.
          </span>
        </Alert>
      )}

      {err && (
        <div className="mt-4">
          <Alert onDismiss={() => setErr('')}>{err}</Alert>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {sorted.length === 0 && <p className="text-slate-500">No sessions listed yet.</p>}
        {sorted.map((s) => (
          <div key={s.id} className="card border-ink-600">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-white">{s.title}</h2>
                <p className="text-sm text-slate-400">
                  {s.sessionDate} · {s.sessionTz} · {formatMoney(s.priceAmount, s.currency)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {s.creator?.displayName || s.creator?.user?.name || 'Creator'}
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary text-sm"
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              >
                {expanded === s.id ? 'Hide slots' : 'View slots'}
              </button>
            </div>
            {expanded === s.id && (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {(s.slots || []).map((slot) => {
                  const available = slot.status === 'available';
                  const locked = slot.status === 'locked';
                  const booked = slot.status === 'booked';
                  return (
                    <li
                      key={slot.id}
                      className={`rounded-xl border px-3 py-2 text-sm ${
                        available
                          ? 'border-ink-600 bg-ink-900/50'
                          : 'border-ink-700 bg-ink-950/50 opacity-70'
                      }`}
                    >
                      <div className="text-slate-200">{formatSlotTime(slot.startUtc)}</div>
                      <div className="text-xs text-slate-500 capitalize">{slot.status}</div>
                      {available && token && (
                        <button type="button" className="btn-primary mt-2 w-full text-xs py-1.5" onClick={() => book(slot.id)}>
                          Book & pay
                        </button>
                      )}
                      {available && !token && (
                        <Link to="/login" className="btn-secondary mt-2 block w-full text-center text-xs py-1.5">
                          Log in to book
                        </Link>
                      )}
                      {locked && <p className="mt-2 text-xs text-amber-400">Someone is checking out…</p>}
                      {booked && <p className="mt-2 text-xs text-slate-500">Taken</p>}
                    </li>
                  );
                })}
              </ul>
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
            setExpanded(null);
          }}
          onClose={() => setPay(null)}
        />
      )}
    </div>
  );
}
