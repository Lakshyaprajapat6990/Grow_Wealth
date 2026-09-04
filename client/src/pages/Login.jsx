import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(userId.trim().toUpperCase(), password);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={onSubmit}>
        <div className="auth-brand">
          <span className="logo-mark" />
          <h1>Grow Wealth</h1>
          <p>Member Login</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="field">
          <label className="label">User ID</label>
          <input
            className="input"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="GW1234567"
            required
          />
        </div>
        <div className="field">
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Signing in…' : 'LOGIN NOW'}
        </button>

        <p className="auth-foot" style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
          New IDs can login only after $1 joining is approved by admin.
        </p>

        <p className="auth-foot">
          New here? <Link to="/register">Create account</Link>
        </p>
      </form>
    </div>
  );
}
