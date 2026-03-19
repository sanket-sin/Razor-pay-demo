import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as groupApi from '../services/groupSessions.js';
import { getErrorMessage } from '../services/api.js';
import { todayISODate, addDaysISODate } from '../utils/money.js';
import Alert from '../components/Alert.jsx';

export default function CreateGroupSession() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('Group bootcamp');
  const [startDate, setStart] = useState(todayISODate());
  const [endDate, setEnd] = useState(addDaysISODate(14));
  const [sessionTz, setTz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [dailyStartMinute, setDs] = useState(14 * 60);
  const [dailyEndMinute, setDe] = useState(16 * 60);
  const [maxParticipants, setMax] = useState(5);
  const [priceAmount, setPrice] = useState(19900);
  const [currency, setCurrency] = useState('usd');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await groupApi.createGroupSession({
        title,
        startDate,
        endDate,
        sessionTz,
        dailyStartMinute: Number(dailyStartMinute),
        dailyEndMinute: Number(dailyEndMinute),
        maxParticipants: Number(maxParticipants),
        priceAmount: Number(priceAmount),
        currency,
      });
      navigate('/groups');
    } catch (er) {
      setErr(getErrorMessage(er));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-2xl font-bold text-white">Create group session</h1>
      <form onSubmit={submit} className="card mt-6 space-y-4 border-ink-600">
        {err && <Alert>{err}</Alert>}
        <div>
          <label className="label">Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Start date</label>
            <input className="input" type="date" value={startDate} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label className="label">End date</label>
            <input className="input" type="date" value={endDate} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Timezone</label>
          <input className="input" value={sessionTz} onChange={(e) => setTz(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Daily start (min)</label>
            <input className="input" type="number" value={dailyStartMinute} onChange={(e) => setDs(e.target.value)} />
          </div>
          <div>
            <label className="label">Daily end</label>
            <input className="input" type="number" value={dailyEndMinute} onChange={(e) => setDe(e.target.value)} />
          </div>
          <div>
            <label className="label">Max participants</label>
            <input className="input" type="number" value={maxParticipants} onChange={(e) => setMax(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Price (minor)</label>
            <input className="input" type="number" value={priceAmount} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label className="label">Currency</label>
            <input className="input" maxLength={3} value={currency} onChange={(e) => setCurrency(e.target.value.toLowerCase())} />
          </div>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Creating…' : 'Publish group session'}
        </button>
      </form>
    </div>
  );
}
