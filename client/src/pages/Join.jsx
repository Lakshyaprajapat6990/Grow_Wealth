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
      <p className="page-sub">Pay joining from your fund balance after deposit (min $1).</p>

      <div className="card" style={{ padding: '1.25rem', maxWidth: 520 }}>
        {user?.isJoined ? (
          <div className="alert alert-success">
            Already joined on {user.joinedAt ? new Date(user.joinedAt).toLocaleString() : '—'}. You can deposit more
            anytime.
          </div>
        ) : (
          <>
            {err && <div className="alert alert-error">{err}</div>}
            {msg && <div className="alert alert-success">{msg}</div>}
            <p>
              Fund Balance: <strong>${(user?.fundBalance || 0).toFixed(2)}</strong>
              {(user?.leaderIncentiveAmount || 0) > 0 && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  {' '}
                  (includes ${(user.leaderIncentiveAmount || 0).toFixed(0)} locked gift)
                </span>
              )}
            </p>
            <p style={{ color: 'var(--text-muted)' }}>
              Need at least $1 spendable principal (gift cannot be used for joining). If you already deposited, click
              Activate Joining. Your sponsor earns Refer & Earn on this joining amount (L1 5% · L2 2% · L3 1%).
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              <Link className="btn btn-success" to="/deposit?amount=1&purpose=joining">
                Pay $1 Joining
              </Link>
              <button
                className="btn btn-primary"
                type="button"
                onClick={activate}
                disabled={
                  loading ||
                  Number(user?.principalBalance ?? Number(user?.fundBalance || 0) - Number(user?.leaderIncentiveAmount || 0)) <
                    1
                }
              >
                {loading ? 'Activating…' : 'Activate $1 Joining'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
