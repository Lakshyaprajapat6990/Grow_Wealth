import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const empty = {
  name: '',
  email: '',
  mobile: '',
  password: '',
  confirmPassword: '',
  country: 'INDIA',
  walletAddress: '',
  sponsorId: '',
  agreeTerms: false,
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ ...empty, sponsorId: params.get('ref') || '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sponsorMsg, setSponsorMsg] = useState('');

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  useEffect(() => {
    if (form.sponsorId) verifySponsor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verifySponsor() {
    if (!form.sponsorId) return;
    try {
      const { data } = await api.get(`/auth/check-sponsor/${form.sponsorId.trim().toUpperCase()}`);
      setSponsorMsg(data.valid ? `✓ Sponsor: ${data.name}` : data.message || 'Invalid sponsor');
    } catch {
      setSponsorMsg('Could not verify sponsor');
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!form.agreeTerms) {
      setError('Please agree to the terms of service.');
      return;
    }
    const wallet = form.walletAddress.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      setError('Valid USDT BEP-20 Wallet Address is required (0x + 40 hex characters).');
      return;
    }
    setLoading(true);
    try {
      const data = await register({
        ...form,
        sponsorId: form.sponsorId.trim().toUpperCase(),
        walletAddress: wallet,
        agreeTerms: true,
      });
      setSuccess({
        userId: data.userId,
        transactionPassword: data.transactionPassword,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="card auth-card">
          <div className="alert alert-success">Account created successfully</div>
          <p>
            Your User ID: <strong>{success.userId}</strong>
          </p>
          <p>
            Transaction Password: <strong>{success.transactionPassword}</strong>
          </p>
          <p className="muted">Save these details. Next: login → dashboard → pay $1 to join.</p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="card auth-card wide" onSubmit={onSubmit}>
        <div className="auth-brand">
          <span className="logo-mark" />
          <h1>Grow Wealth</h1>
          <p>Create Free Account</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="field">
          <label className="label">Sponsor ID</label>
          <input
            className="input"
            value={form.sponsorId}
            onChange={(e) => set('sponsorId', e.target.value)}
            onBlur={verifySponsor}
            placeholder="GW0000001 or leave blank"
          />
          {sponsorMsg && <small className="hint">{sponsorMsg}</small>}
        </div>

        <div className="grid-2">
          <div className="field">
            <label className="label">Full Name</label>
            <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </div>
          <div className="field">
            <label className="label">Mobile</label>
            <input className="input" value={form.mobile} onChange={(e) => set('mobile', e.target.value)} required />
          </div>
        </div>

        <div className="field">
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            required
          />
        </div>

        <div className="grid-2">
          <div className="field">
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label">Confirm Password</label>
            <input
              className="input"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => set('confirmPassword', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="field">
          <label className="label">Country</label>
          <select className="select" value={form.country} onChange={(e) => set('country', e.target.value)}>
            <option>INDIA</option>
            <option>USA</option>
            <option>UAE</option>
            <option>NIGERIA</option>
            <option>OTHER</option>
          </select>
        </div>

        <div className="field">
          <label className="label">Your USDT BEP-20 Wallet Address</label>
          <input
            className="input"
            value={form.walletAddress}
            onChange={(e) => set('walletAddress', e.target.value)}
            placeholder="0x + 40 characters"
            required
          />
          <small className="hint">Your withdrawal wallet (must be BEP-20)</small>
        </div>

        <label className="check">
          <input
            type="checkbox"
            checked={form.agreeTerms}
            onChange={(e) => set('agreeTerms', e.target.checked)}
          />
          I agree to the terms of service
        </label>

        <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }} disabled={loading}>
          {loading ? 'Creating…' : 'REGISTER NOW'}
        </button>

        <p className="auth-foot">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
