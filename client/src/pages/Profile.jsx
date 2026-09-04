import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const rows = [
    ['Sponsor ID', user?.sponsorId],
    ['Name', user?.name],
    ['User ID', user?.userId],
    ['Email', user?.email],
    ['Mobile', user?.mobile],
    ['Country', user?.country],
    ['Wallet', user?.walletAddress],
    ['Joined', user?.isJoined ? 'Yes' : 'No'],
    ['Joining Date', user?.joinedAt ? new Date(user.joinedAt).toLocaleString() : '—'],
    ['Directs', user?.directCount ?? 0],
  ];

  async function deleteAccount(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    if (!window.confirm('Delete your account permanently? This cannot be undone.')) return;
    setLoading(true);
    try {
      const { data } = await api.delete('/user/account', {
        data: { password, confirmText },
      });
      setMsg(data.message);
      logout();
      setTimeout(() => navigate('/login'), 800);
    } catch (error) {
      setErr(error.response?.data?.message || 'Could not delete account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">My Profile</h1>
      <div className="card" style={{ padding: '0.25rem 1.25rem', marginBottom: '1rem' }}>
        {rows.map(([k, v]) => (
          <div
            key={k}
            style={{
              display: 'grid',
              gridTemplateColumns: '160px 1fr',
              gap: '0.75rem',
              padding: '0.9rem 0',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <strong>{k}</strong>
            <span style={{ color: 'var(--text-muted)', wordBreak: 'break-all' }}>{v || '—'}</span>
          </div>
        ))}
      </div>

      {user?.role !== 'admin' && (
        <div className="card" style={{ padding: '1.25rem', borderColor: 'rgba(248,113,113,0.4)' }}>
          <h3 style={{ marginTop: 0, color: '#fca5a5' }}>Delete My Account</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            This permanently removes your profile, wallet history, and related records. Your team members will be moved
            under your sponsor.
          </p>
          {!showDelete ? (
            <button className="btn btn-ghost" type="button" onClick={() => setShowDelete(true)}>
              I want to delete my account
            </button>
          ) : (
            <form onSubmit={deleteAccount}>
              {err && <div className="alert alert-error">{err}</div>}
              {msg && <div className="alert alert-success">{msg}</div>}
              <div className="field">
                <label className="label">Login Password</label>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label className="label">Type DELETE to confirm</label>
                <input
                  className="input"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" style={{ background: '#dc2626' }} disabled={loading}>
                  {loading ? 'Deleting…' : 'Delete Account Forever'}
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => setShowDelete(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
