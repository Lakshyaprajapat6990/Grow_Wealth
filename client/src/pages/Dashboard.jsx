import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get('/user/dashboard/summary').then((r) => setSummary(r.data)).catch(() => {});
  }, []);

  const s = summary?.summary || user || {};
  const refLink = `${window.location.origin}/register?ref=${user?.userId}`;

  const stats = [
    { label: 'Fund Balance', value: `$${(s.fundBalance || 0).toFixed(2)}`, cls: '' },
    { label: 'Income Balance', value: `$${(s.incomeBalance || 0).toFixed(2)}`, cls: 'green' },
    { label: 'Total Deposited', value: `$${(s.totalDeposited || 0).toFixed(2)}`, cls: '' },
    { label: 'Total ROI', value: `$${(s.totalRoiIncome || 0).toFixed(2)}`, cls: 'gold' },
    { label: 'Direct Income', value: `$${(s.totalDirectIncome || 0).toFixed(2)}`, cls: '' },
    { label: 'Level Income', value: `$${(s.totalLevelIncome || 0).toFixed(2)}`, cls: '' },
    { label: 'Total Withdrawn', value: `$${(s.totalWithdrawn || 0).toFixed(2)}`, cls: '' },
    { label: 'Direct Team', value: s.directCount || 0, cls: '' },
  ];

  const quick = [
    { to: '/deposit', icon: '💰', label: 'Deposit' },
    { to: '/join', icon: '✅', label: 'Join $1' },
    { to: '/withdrawals', icon: '💸', label: 'Withdraw' },
    { to: '/transfer', icon: '🔄', label: 'Transfer' },
    { to: '/direct-team', icon: '👥', label: 'My Team' },
    { to: '/roi-income', icon: '📈', label: 'ROI Income' },
    { to: '/support', icon: '🎫', label: 'Support' },
    { to: '/system-live-feed', icon: '📡', label: 'Live Feed' },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome, ${user?.name} · Status: ${
          user?.isJoined ? '✅ Joined' : '⏳ Joining pending / not activated'
        }`}
      />

      {!user?.isJoined && (
        <div
          className="alert alert-error"
          style={{
            background: 'rgba(251,191,36,0.12)',
            color: '#fbbf24',
            border: '1px solid rgba(251,191,36,0.35)',
            marginBottom: '1rem',
          }}
        >
          Your joining ($1) is not active yet. If you paid at registration, wait for admin approval — or check{' '}
          <Link to="/join">Join page</Link>.
        </div>
      )}

      <div className="dash-grid">
        {stats.map((st) => (
          <div className={`card dash-card ${st.cls}`} key={st.label}>
            <div className="label">{st.label}</div>
            <div className="value">{st.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <h3 style={{ marginTop: 0, color: '#93c5fd' }}>Your Team Referral Link</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>
          Share this link — new members register under your ID as sponsor.
        </p>
        <code style={{ color: '#60a5fa', wordBreak: 'break-all', fontSize: '0.88rem' }}>{refLink}</code>
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" type="button" onClick={() => navigator.clipboard.writeText(refLink)}>
            Copy Team Link
          </button>
          <Link className="btn btn-primary" to="/direct-team">
            View Direct Team
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ marginTop: 0, color: '#93c5fd' }}>Quick Actions</h3>
        <div className="quick-grid">
          {quick.map((q) => (
            <Link key={q.to} to={q.to} className="quick-btn">
              <span>{q.icon}</span>
              <span>{q.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
