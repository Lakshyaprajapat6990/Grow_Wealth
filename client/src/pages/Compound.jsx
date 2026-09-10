import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';

export default function Compound() {
  const { user, refreshUser } = useAuth();
  const [info, setInfo] = useState(null);
  const [amount, setAmount] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    const { data } = await api.get('/wallet/info');
    setInfo(data);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    setLoading(true);
    try {
      const { data } = await api.post('/wallet/compound', { amount: Number(amount) });
      refreshUser(data.user);
      setMsg(data.message);
      setAmount('');
      await load();
    } catch (error) {
      setErr(error.response?.data?.message || 'Compound failed');
    } finally {
      setLoading(false);
    }
  }

  const income = info?.incomeBalance ?? user?.incomeBalance ?? 0;

  return (
    <div>
      <PageHeader
        title="Manual Compound"
        subtitle="Move income balance to fund balance · increases ROI base"
      />

      <form className="card" style={{ padding: '1.25rem', maxWidth: 520 }} onSubmit={submit}>
        {err && <div className="alert alert-error">{err}</div>}
        {msg && <div className="alert alert-success">{msg}</div>}

        <p>
          Income Balance: <strong>${Number(income).toFixed(2)}</strong>
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Compounding is manual per plan. Compounded amount is added to fund / deposit base for daily 1% ROI
          (capped at 2× investment).
        </p>

        <div className="field">
          <label className="label">Amount to compound</label>
          <input
            className="input"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={income <= 0}
            onClick={() => setAmount(String(Number(income).toFixed(2)))}
          >
            Max
          </button>
          <button className="btn btn-primary" disabled={loading || !user?.isJoined}>
            {loading ? 'Compounding…' : 'CONFIRM COMPOUND'}
          </button>
        </div>
        {!user?.isJoined && (
          <p style={{ color: 'var(--warning)' }}>Activate joining before compounding.</p>
        )}
      </form>
    </div>
  );
}
