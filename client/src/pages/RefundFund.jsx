import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { mustContactForWithdraw, WITHDRAW_CONTACT } from '../constants/withdrawContactGate';

export default function RefundFund() {
  const { user, refreshUser } = useAuth();
  const [info, setInfo] = useState(null);
  const [amount, setAmount] = useState('');
  const [trx, setTrx] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const gated = mustContactForWithdraw(user?.userId);

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
    if (gated) {
      setErr(WITHDRAW_CONTACT.message);
      return;
    }
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
  const totalRoi = Number(info?.totalRoiIncome ?? user?.totalRoiIncome ?? 0);
  const amt = Number(amount) || 0;
  const feePreview = Number(((amt * feePct) / 100).toFixed(2));
  const totalDeductions = Number((feePreview + totalRoi).toFixed(2));
  const netPreview = Number(Math.max(0, amt - totalDeductions).toFixed(2));
  const isTooLow = amt > 0 && amt <= totalDeductions;

  return (
    <div>
      <h1 className="page-title">Refund Fund</h1>
      <p className="page-sub">
        Refund spendable Fund Balance · Min ${minWd} · Fee {feePct}% + All Days ROI Deducted · Process {processHrs}h
      </p>

      <form className="card" style={{ padding: '1.25rem', maxWidth: 520 }} onSubmit={submit}>
        {err && <div className="alert alert-error">{err}</div>}
        {msg && <div className="alert alert-success">{msg}</div>}

        <p style={{ color: 'var(--warning)', fontSize: '0.9rem', lineHeight: 1.5 }}>
          Fund Balance refund deducts <strong>{feePct}% cancellation fee</strong> AND <strong>all daily ROI income received</strong>. Locked gift cannot be refunded. Max 1 withdraw/refund per day (UTC).
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
          <label className="label">Refund Amount (before deductions)</label>
          <input
            className="input"
            type="number"
            min={minWd}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Min $${minWd}`}
            required
          />
        </div>

        {/* Live Refund Breakdown */}
        {amt >= minWd && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '0.9rem 1rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Requested Refund:</span>
              <strong>${amt.toFixed(2)} USDT</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Exit Fee ({feePct}%):</span>
              <span style={{ color: '#ef4444' }}>-${feePreview.toFixed(2)} USDT</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>All Days ROI Received (Deducted):</span>
              <span style={{ color: '#ef4444' }}>-${totalRoi.toFixed(2)} USDT</span>
            </div>
            <div
              style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                fontSize: '1rem',
              }}
            >
              <span>Net Refund Payout:</span>
              <span style={{ color: netPreview > 0 ? '#4ade80' : '#ef4444' }}>
                ${netPreview.toFixed(2)} USDT
              </span>
            </div>
            {isTooLow && (
              <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: '0.5rem 0 0' }}>
                ⚠️ Refund amount must be greater than total deductions (${totalDeductions.toFixed(2)} USDT).
              </p>
            )}
          </div>
        )}

        <div className="field">
          <label className="label">Transaction Password</label>
          <input className="input" type="password" value={trx} onChange={(e) => setTrx(e.target.value)} required />
        </div>

        {gated && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {WITHDRAW_CONTACT.message}
            <div style={{ marginTop: '0.5rem' }}>
              <a href={`tel:${WITHDRAW_CONTACT.phoneTel}`}>
                Call {WITHDRAW_CONTACT.name}: {WITHDRAW_CONTACT.phone}
              </a>
            </div>
          </div>
        )}

        <button
          className="btn btn-primary"
          disabled={loading || !user?.isJoined || gated || isTooLow || amt > principal}
        >
          {loading ? 'Submitting…' : 'CONFIRM FUND REFUND'}
        </button>

        {!user?.isJoined && (
          <p style={{ color: 'var(--warning)', marginTop: '0.5rem' }}>Activate joining before refunding.</p>
        )}
      </form>
    </div>
  );
}
