import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Join() {
  const { user, refreshUser } = useAuth();
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

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
      <h1 className="page-title">Activate Joining — $1</h1>
      <p className="page-sub">Pay joining from your fund balance after deposit.</p>

      <div className="card" style={{ padding: '1.25rem', maxWidth: 520 }}>
        {user?.isJoined ? (
          <div className="alert alert-success">
            Already joined on {user.joinedAt ? new Date(user.joinedAt).toLocaleString() : '—'}. You can deposit any
            amount anytime.
          </div>
        ) : (
          <>
            {err && <div className="alert alert-error">{err}</div>}
            {msg && <div className="alert alert-success">{msg}</div>}
            <p>
              Fund Balance: <strong>${(user?.fundBalance || 0).toFixed(2)}</strong>
            </p>
            <p style={{ color: 'var(--text-muted)' }}>
              Need at least $1 in fund balance. <Link to="/deposit">Deposit USDT first</Link>, then activate here.
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
