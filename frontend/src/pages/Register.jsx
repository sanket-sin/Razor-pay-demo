import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/auth.js';
import { getErrorMessage } from '../services/api.js';
import { useAuthStore } from '../store/authStore.js';
import Alert from '../components/Alert.jsx';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('buyer');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const { user, token } = await register({ email, password, name, role });
      setSession(token, user);
      navigate(role === 'creator' ? '/creator' : '/');
    } catch (er) {
      setErr(getErrorMessage(er));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-2xl font-bold text-white">Create account</h1>
      <p className="mt-1 text-sm text-slate-400">
        Already have one?{' '}
        <Link to="/login" className="text-accent hover:underline">
          Log in
        </Link>
      </p>
      <form onSubmit={submit} className="card mt-6 space-y-4 border-ink-600">
        {err && <Alert>{err}</Alert>}
        <div>
          <label className="label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div>
          <label className="label">Password (min 8)</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="label">I am a</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="buyer">Buyer — book & shop</option>
            <option value="creator">Creator — sell sessions & products</option>
          </select>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Creating…' : 'Register'}
        </button>
      </form>
    </div>
  );
}
