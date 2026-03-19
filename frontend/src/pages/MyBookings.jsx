import { useEffect, useState } from 'react';
import * as bookingsApi from '../services/bookings.js';
import * as cancellationsApi from '../services/cancellations.js';
import { getErrorMessage } from '../services/api.js';
import { formatMoney } from '../utils/money.js';
import Spinner from '../components/Spinner.jsx';
import Alert from '../components/Alert.jsx';
import { useAuthStore } from '../store/authStore.js';

function formatSlotTime(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const CANCELABLE_BOOKING_STATUSES = ['pending_payment', 'confirmed'];

export default function MyBookings() {
  const user = useAuthStore((s) => s.user);
  const [sessionBookings, setSessionBookings] = useState([]);
  const [groupBookings, setGroupBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [result, setResult] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [asCreator, setAsCreator] = useState(false);

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const [sessions, groups] = await Promise.all([
        bookingsApi.listMyBookings(),
        bookingsApi.listMyGroupBookings(),
      ]);
      setSessionBookings(Array.isArray(sessions) ? sessions : []);
      setGroupBookings(Array.isArray(groups) ? groups : []);
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCancelSession = async (bookingId) => {
    setErr('');
    setResult(null);
    setCancellingId(bookingId);
    try {
      const data = await cancellationsApi.cancelSessionBooking(bookingId, asCreator);
      setResult(
        data.refunded
          ? { type: 'success', message: `Booking cancelled. Refund: ${data.refundAmount} minor units.` }
          : { type: 'info', message: data.message || 'Booking cancelled.' }
      );
      await load();
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setCancellingId(null);
    }
  };

  const handleCancelGroup = async (groupBookingId) => {
    setErr('');
    setResult(null);
    setCancellingId(groupBookingId);
    try {
      const data = await cancellationsApi.cancelGroupBooking(groupBookingId, asCreator);
      setResult(
        data.refunded
          ? { type: 'success', message: `Group booking cancelled. Refund: ${data.refundAmount} minor units.` }
          : { type: 'info', message: 'Group booking cancelled.' }
      );
      await load();
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setCancellingId(null);
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
      <h1 className="font-display text-2xl font-bold text-white">My bookings</h1>
      <p className="mt-1 text-sm text-slate-400">
        Cancel 1:1 or group sessions. Full refund if ≥24h before start; 50% if ≥6h; else no refund.
        {user?.role === 'creator' && (
          <label className="mt-2 flex items-center gap-2">
            <input type="checkbox" checked={asCreator} onChange={(e) => setAsCreator(e.target.checked)} />
            <span>Cancel as creator (full refund)</span>
          </label>
        )}
      </p>
      {err && (
        <div className="mt-4">
          <Alert onDismiss={() => setErr('')}>{err}</Alert>
        </div>
      )}
      {result && (
        <Alert type={result.type} onDismiss={() => setResult(null)} className="mt-4">
          {result.message}
        </Alert>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-200">1:1 sessions</h2>
        <ul className="mt-4 space-y-4">
          {sessionBookings.length === 0 && <p className="text-slate-500">No 1:1 bookings.</p>}
          {sessionBookings.map((b) => {
            const session = b.slot?.session;
            const canCancel = CANCELABLE_BOOKING_STATUSES.includes(b.status);
            return (
              <li key={b.id} className="card border-ink-600">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium text-white">{session?.title || 'Session'}</span>
                  <span className="text-sm text-slate-400 capitalize">{b.status?.replace('_', ' ')}</span>
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  {b.slot && formatSlotTime(b.slot.startUtc)}
                  {session && ` · ${formatMoney(session.priceAmount, session.currency)}`}
                </p>
                {canCancel && (
                  <button
                    type="button"
                    className="btn-secondary mt-3 text-sm"
                    onClick={() => handleCancelSession(b.id)}
                    disabled={cancellingId === b.id}
                  >
                    {cancellingId === b.id ? 'Cancelling…' : 'Cancel booking'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-200">Group sessions</h2>
        <ul className="mt-4 space-y-4">
          {groupBookings.length === 0 && <p className="text-slate-500">No group bookings.</p>}
          {groupBookings.map((b) => {
            const gs = b.groupSession;
            const canCancel = CANCELABLE_BOOKING_STATUSES.includes(b.status);
            return (
              <li key={b.id} className="card border-ink-600">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium text-white">{gs?.title || 'Group session'}</span>
                  <span className="text-sm text-slate-400 capitalize">{b.status?.replace('_', ' ')}</span>
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  {gs?.startDate} – {gs?.endDate}
                  {gs && ` · ${formatMoney(gs.priceAmount, gs.currency)}`}
                </p>
                {canCancel && (
                  <button
                    type="button"
                    className="btn-secondary mt-3 text-sm"
                    onClick={() => handleCancelGroup(b.id)}
                    disabled={cancellingId === b.id}
                  >
                    {cancellingId === b.id ? 'Cancelling…' : 'Cancel booking'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
