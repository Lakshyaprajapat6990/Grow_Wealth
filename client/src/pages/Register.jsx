import { useEffect, useMemo, useState } from 'react';
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
  joiningTxHash: '',
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
  const [info, setInfo] = useState({
    joiningAmount: 1,
    depositAddress: '',
    network: 'BEP-20 (BSC)',
  });

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  useEffect(() => {
    api
      .get('/auth/register-info')
      .then((r) => setInfo(r.data))
      .catch(() => {});
    if (form.sponsorId) verifySponsor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const qrUrl = useMemo(
    () =>
      info.depositAddress
        ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(info.depositAddress)}`
        : '',
    [info.depositAddress]
  );

  async function verifySponsor() {
    if (!form.sponsorId) return;
    try {
      const { data } = await api.get(`/auth/check-sponsor/${form.sponsorId.trim().toUpperCase()}`);
      setSponsorMsg(data.valid ? `✓ Sponsor: ${data.name}` : data.message || 'Invalid sponsor');
    } catch {
      setSponsorMsg('Could not verify sponsor');
    }
  }

  async function copyAddress() {
    if (!info.depositAddress) return;
    await navigator.clipboard.writeText(info.depositAddress);
    setSponsorMsg((m) => m || '✓ Address copied');
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
    const txHash = form.joiningTxHash.trim();
    if (!txHash || txHash.length < 10) {
      setError(`Pay $${info.joiningAmount} USDT joining fee and paste the Tx Hash.`);
      return;
    }
    setLoading(true);
    try {
      const data = await register({
        ...form,
        sponsorId: form.sponsorId.trim().toUpperCase(),
        walletAddress: wallet,
        joiningTxHash: txHash,
        agreeTerms: true,
      });
      setSuccess({
        userId: data.userId,
        transactionPassword: data.transactionPassword,
        joiningPending: data.joiningPending,
        joiningAmount: data.joiningAmount || info.joiningAmount,
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
          <div className="alert alert-success">Registration submitted</div>
          <p>
            Your User ID: <strong>{success.userId}</strong>
          </p>
          <p>
            Transaction Password: <strong>{success.transactionPassword}</strong>
          </p>
          {success.joiningPending && (
            <div
              className="alert alert-error"
              style={{
                background: 'rgba(251,191,36,0.12)',
                color: '#fbbf24',
                border: '1px solid rgba(251,191,36,0.35)',
              }}
            >
              Save your User ID. Login will work only after admin approves your ${success.joiningAmount} joining
              payment.
            </div>
          )}
          <p className="muted">Save these details safely.</p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/login')}>
            Go to Login
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
          <p>Create Account · Joining ${info.joiningAmount} USDT</p>
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

        <div className="join-pay-box">
          <h3>Pay Joining Amount — ${info.joiningAmount} USDT</h3>
          <p>Send exactly <strong>${info.joiningAmount} USDT</strong> on <strong>{info.network}</strong> to company address, then paste Tx Hash below.</p>
          <div className="join-pay-row">
            {qrUrl && <img src={qrUrl} alt="Joining payment QR" />}
            <div>
              <div className="label">Company Deposit Address</div>
              <code>{info.depositAddress || 'Loading...'}</code>
              <button type="button" className="btn btn-ghost" style={{ marginTop: '0.5rem' }} onClick={copyAddress}>
                Copy Address
              </button>
            </div>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Joining Tx Hash (required)</label>
            <input
              className="input"
              value={form.joiningTxHash}
              onChange={(e) => set('joiningTxHash', e.target.value)}
              placeholder="0x... paste after paying $1 USDT"
              required
            />
          </div>
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
          {loading ? 'Creating…' : `REGISTER & SUBMIT $${info.joiningAmount} JOINING`}
        </button>

        <p className="auth-foot">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
