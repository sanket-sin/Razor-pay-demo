import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login } from '../services/auth.js';
import { getErrorMessage } from '../services/api.js';
import { useAuthStore } from '../store/authStore.js';
import Alert from '../components/Alert.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from?.pathname || '/';

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const { user, token } = await login({ email, password });
      setSession(token, user);
      navigate(from === '/login' ? '/' : from, { replace: true });
    } catch (er) {
      setErr(getErrorMessage(er));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-2xl font-bold text-white">Log in</h1>
      <p className="mt-1 text-sm text-slate-400">
        No account?{' '}
        <Link to="/register" className="text-accent hover:underline">
          Register
        </Link>
      </p>
      <form onSubmit={submit} className="card mt-6 space-y-4 border-ink-600">
        {err && <Alert>{err}</Alert>}
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
