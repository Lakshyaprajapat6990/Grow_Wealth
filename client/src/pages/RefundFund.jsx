import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function RefundFund() {
  const { user, refreshUser } = useAuth();
  const [info, setInfo] = useState(null);
  const [amount, setAmount] = useState('');
  const [trx, setTrx] = useState('');
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
      const { data } = await api.post('/wallet/refund-fund', {
        amount: Number(amount),
        transactionPassword: trx,
      });
      refreshUser(data.user);
      setMsg(data.message);
      setAmount('');
      setTrx('');
      await load();
    } catch (error) {
      setErr(error.response?.data?.message || 'Fund refund failed');
    } finally {
      setLoading(false);
    }
  }

  const feePct = Number(info?.fundRefundFeePercent ?? 20);
  const minWd = info?.withdrawMin ?? 10;
  const processHrs = info?.withdrawProcessingHours || '24-48';
  const principal = Number(
    info?.principalBalance ??
      user?.principalBalance ??
      Number(info?.fundBalance ?? user?.fundBalance ?? 0) -
        Number(info?.leaderIncentiveAmount ?? user?.leaderIncentiveAmount ?? 0)
  );
  const amt = Number(amount) || 0;
  const feePreview = Number(((amt * feePct) / 100).toFixed(2));
  const netPreview = Number(Math.max(0, amt - feePreview).toFixed(2));

  return (
    <div>
      <h1 className="page-title">Refund Fund</h1>
      <p className="page-sub">
        Refund spendable Fund Balance · Min ${minWd} · Fee {feePct}% · Process {processHrs}h
      </p>

      <form className="card" style={{ padding: '1.25rem', maxWidth: 520 }} onSubmit={submit}>
        {err && <div className="alert alert-error">{err}</div>}
        {msg && <div className="alert alert-success">{msg}</div>}

        <p style={{ color: 'var(--warning)', fontSize: '0.9rem' }}>
          Fund Balance refund deducts {feePct}%. Locked gift cannot be refunded. Max 1 withdraw/refund per day (UTC).
        </p>

        <p>
          Spendable Fund Balance: <strong>${principal.toFixed(2)}</strong>
        </p>
        {(info?.leaderIncentiveAmount ?? user?.leaderIncentiveAmount ?? 0) > 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Display Fund ${(info?.fundBalance ?? user?.fundBalance ?? 0).toFixed(2)} includes $
            {Number(info?.leaderIncentiveAmount ?? user?.leaderIncentiveAmount ?? 0).toFixed(0)} locked gift
          </p>
        )}
        <p style={{ color: 'var(--text-muted)', wordBreak: 'break-all' }}>
          Payout wallet: {user?.walletAddress}
        </p>

        <div className="field">
          <label className="label">Amount (before fee)</label>
          <input
            className="input"
            type="number"
            min={minWd}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        {amt >= minWd && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Fee {feePct}% = ${feePreview.toFixed(2)} · You receive ≈ ${netPreview.toFixed(2)}
          </p>
        )}
        <div className="field">
          <label className="label">Transaction Password</label>
          <input className="input" type="password" value={trx} onChange={(e) => setTrx(e.target.value)} required />
        </div>
        <button className="btn btn-primary" disabled={loading || !user?.isJoined}>
          {loading ? 'Submitting…' : 'CONFIRM FUND REFUND'}
        </button>
        {!user?.isJoined && (
          <p style={{ color: 'var(--warning)' }}>Activate joining before refunding.</p>
        )}
      </form>
    </div>
  );
}
