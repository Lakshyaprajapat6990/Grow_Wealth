import { useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';

export default function Transfer() {
  const { user, refreshUser } = useAuth();
  const [receiverUserId, setReceiverUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [trx, setTrx] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    setLoading(true);
    try {
      const { data } = await api.post('/wallet/transfer', {
        receiverUserId: receiverUserId.trim().toUpperCase(),
        amount: Number(amount),
        transactionPassword: trx,
      });
      refreshUser(data.user);
      setMsg('Transfer successful');
      setReceiverUserId('');
      setAmount('');
      setTrx('');
    } catch (error) {
      setErr(error.response?.data?.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Fund Transfer" subtitle="P2P transfer to another User ID · Min $1" />
      <form className="card" style={{ padding: '1.25rem', maxWidth: 480 }} onSubmit={submit}>
        {err && <div className="alert alert-error">{err}</div>}
        {msg && <div className="alert alert-success">{msg}</div>}
        <p>Fund Balance: <strong>${(user?.fundBalance || 0).toFixed(2)}</strong></p>
        <div className="field">
          <label className="label">Receiver User ID</label>
          <input className="input" value={receiverUserId} onChange={(e) => setReceiverUserId(e.target.value)} placeholder="GW1234567" required />
        </div>
        <div className="field">
          <label className="label">Amount ($)</label>
          <input className="input" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
            {[1, 5, 10, 20, 50].map((v) => (
              <button key={v} type="button" className="btn btn-ghost" style={{ flex: 1, padding: '0.4rem' }} onClick={() => setAmount(String(v))}>
                ${v}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label className="label">Transaction Password</label>
          <input className="input" type="password" value={trx} onChange={(e) => setTrx(e.target.value)} required />
        </div>
        <button className="btn btn-primary" disabled={loading || !user?.isJoined}>
          {loading ? 'Processing…' : 'TRANSFER FUNDS'}
        </button>
        {!user?.isJoined && <p style={{ color: '#fbbf24', fontSize: '0.88rem' }}>Activate joining first.</p>}
      </form>
    </div>
  );
}
