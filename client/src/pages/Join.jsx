import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Join() {
  const { user, refreshUser } = useAuth();
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingJoin, setPendingJoin] = useState(null);

  useEffect(() => {
    api
      .get('/wallet/history')
      .then((r) => {
        const p = (r.data.history || []).find((h) => h.type === 'joining' && h.status === 'pending');
        setPendingJoin(p || null);
      })
      .catch(() => {});
  }, []);

  async function activate() {
    setErr('');
    setMsg('');
    setLoading(true);
    try {
      const { data } = await api.post('/wallet/join');
      refreshUser(data.user);
      setMsg(data.message);
    } catch (e) {
      setErr(e.response?.data?.message || 'Joining failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Activate Joining</h1>
      <p className="page-sub">New members pay $1 joining at registration. This page is for pending / legacy activation.</p>

      <div className="card" style={{ padding: '1.25rem', maxWidth: 520 }}>
        {user?.isJoined ? (
          <div className="alert alert-success">
            Already joined on {user.joinedAt ? new Date(user.joinedAt).toLocaleString() : '—'}. You can deposit any
            amount anytime.
          </div>
        ) : pendingJoin ? (
          <div className="alert alert-error" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.35)' }}>
            Your ${Number(pendingJoin.amount).toFixed(2)} joining payment is pending admin approval.
            <div style={{ marginTop: '0.5rem', wordBreak: 'break-all', fontSize: '0.85rem' }}>
              Tx: {pendingJoin.meta?.txHash}
            </div>
          </div>
        ) : (
          <>
            {err && <div className="alert alert-error">{err}</div>}
            {msg && <div className="alert alert-success">{msg}</div>}
            <p>
              Fund Balance: <strong>${(user?.fundBalance || 0).toFixed(2)}</strong>
            </p>
            <p style={{ color: 'var(--text-muted)' }}>
              Need at least $1 in fund balance. <Link to="/deposit">Deposit now</Link> then activate here.
            </p>
            <button className="btn btn-primary" onClick={activate} disabled={loading || (user?.fundBalance || 0) < 1}>
              {loading ? 'Activating…' : 'Activate $1 Joining'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
