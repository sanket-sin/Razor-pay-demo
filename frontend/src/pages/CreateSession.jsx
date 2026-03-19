import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as sessionsApi from '../services/sessions.js';
import { getErrorMessage } from '../services/api.js';
import { useAuthStore } from '../store/authStore.js';
import { todayISODate } from '../utils/money.js';
import Alert from '../components/Alert.jsx';

export default function CreateSession() {
  const setCreatorId = useAuthStore((s) => s.setCreatorId);
  const navigate = useNavigate();
  const [title, setTitle] = useState('Coaching call');
  const [sessionDate, setSessionDate] = useState(todayISODate());
  const [sessionTz, setSessionTz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [windowStartMinute, setStart] = useState(14 * 60);
  const [windowEndMinute, setEnd] = useState(18 * 60);
  const [slotDurationMinutes, setDur] = useState(30);
  const [priceAmount, setPrice] = useState(5000);
  const [currency, setCurrency] = useState('usd');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const session = await sessionsApi.createSession({
        title,
        sessionDate,
        sessionTz,
        windowStartMinute: Number(windowStartMinute),
        windowEndMinute: Number(windowEndMinute),
        slotDurationMinutes: Number(slotDurationMinutes),
        priceAmount: Number(priceAmount),
        currency,
      });
      if (session?.creatorId) setCreatorId(session.creatorId);
      navigate('/book');
    } catch (er) {
      setErr(getErrorMessage(er));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-2xl font-bold text-white">Create 1:1 session</h1>
      <form onSubmit={submit} className="card mt-6 space-y-4 border-ink-600">
        {err && <Alert>{err}</Alert>}
        <div>
          <label className="label">Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} required />
          </div>
          <div>
            <label className="label">Timezone (IANA)</label>
            <input className="input" value={sessionTz} onChange={(e) => setSessionTz(e.target.value)} required />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Start (min from midnight)</label>
            <input className="input" type="number" value={windowStartMinute} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label className="label">End</label>
            <input className="input" type="number" value={windowEndMinute} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div>
            <label className="label">Slot length (min)</label>
            <input className="input" type="number" value={slotDurationMinutes} onChange={(e) => setDur(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Price (minor units, e.g. cents)</label>
            <input className="input" type="number" value={priceAmount} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label className="label">Currency</label>
            <input className="input" maxLength={3} value={currency} onChange={(e) => setCurrency(e.target.value.toLowerCase())} />
          </div>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Creating…' : 'Create & generate slots'}
        </button>
      </form>
    </div>
  );
}
