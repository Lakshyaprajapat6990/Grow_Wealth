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
  const rankPlan = summary?.rankPlan || [];
  const refLink = `${window.location.origin}/register?ref=${user?.userId}`;
  const teamBusiness = Number(s.teamBusiness || 0);
  const next = s.nextRank;
  const nextProgress =
    next && next.target > 0 ? Math.min(100, Number(((teamBusiness / next.target) * 100).toFixed(1))) : 100;

  const stats = [
    { label: 'Fund Balance', value: `$${(s.fundBalance || 0).toFixed(2)}`, cls: '' },
    { label: 'Income Balance', value: `$${(s.incomeBalance || 0).toFixed(2)}`, cls: 'green' },
    { label: 'Team Business', value: `$${teamBusiness.toFixed(2)}`, cls: 'gold' },
    { label: 'Current Rank', value: s.currentRank || 0, cls: '' },
    { label: 'Total Deposited', value: `$${(s.totalDeposited || 0).toFixed(2)}`, cls: '' },
    { label: 'Total ROI', value: `$${(s.totalRoiIncome || 0).toFixed(2)}`, cls: 'gold' },
    { label: 'Refer & Earn', value: `$${(s.totalDirectIncome || 0).toFixed(2)}`, cls: '' },
    { label: 'Rank Rewards Paid', value: `$${(s.totalRankReward || 0).toFixed(2)}`, cls: 'gold' },
    { label: 'Level Income', value: `$${(s.totalLevelIncome || 0).toFixed(2)}`, cls: '' },
    { label: 'Direct Team', value: s.directCount || 0, cls: '' },
  ];

  const quick = [
    { to: '/deposit', icon: '💰', label: 'Deposit' },
    { to: '/join', icon: '✅', label: 'Join $1' },
    { to: '/withdrawals', icon: '💸', label: 'Withdraw' },
    { to: '/compound', icon: '♻️', label: 'Compound' },
    { to: '/transfer', icon: '🔄', label: 'Transfer' },
    { to: '/direct-team', icon: '👥', label: 'My Team' },
    { to: '/rank-rewards', icon: '🏆', label: 'Rank Rewards' },
    { to: '/roi-income', icon: '📈', label: 'ROI Income' },
    { to: '/support', icon: '🎫', label: 'Support' },
    { to: '/system-live-feed', icon: '📡', label: 'Live Feed' },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome, ${user?.name} · Status: ${user?.isJoined ? 'Joined' : 'Not Joined - pay $1'}`}
      />

      {!user?.isJoined && (
        <div
          className="card"
          style={{
            padding: '1.25rem',
            marginBottom: '1rem',
            borderColor: 'rgba(247,192,43,0.45)',
            background: 'rgba(247,192,43,0.08)',
          }}
        >
          <h3 style={{ marginTop: 0, color: 'var(--accent)' }}>Activate Joining - $1 USDT</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>
            Deposit at least $1 (or use existing fund balance), then activate joining.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link className="btn btn-success" to="/deposit?amount=1&purpose=joining">
              Pay $1 Joining
            </Link>
            <Link className="btn btn-primary" to="/join">
              Activate $1 Joining
            </Link>
          </div>
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

      {/* Team Business + Rank progress */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          marginBottom: '1rem',
          borderColor: 'rgba(247,192,43,0.35)',
          background: 'linear-gradient(160deg, rgba(22,30,46,0.98), rgba(10,13,20,0.96))',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--accent)' }}>My Team Business</h3>
            <p style={{ margin: '0.4rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Total deposits from your full downline (your own deposit is not counted). Team size does not matter.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Team Business
            </div>
            <div style={{ fontFamily: 'var(--display)', fontSize: '1.7rem', fontWeight: 800, color: 'var(--accent)' }}>
              ${teamBusiness.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Team members: {s.teamSize || 0} · Rank: {s.currentRank || 0}
            </div>
          </div>
        </div>

        {next ? (
          <div style={{ marginTop: '1.1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
              <strong style={{ color: '#fff' }}>
                Next reward: Rank {next.rank} at ${Number(next.target).toLocaleString()} business
              </strong>
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{next.reward} USDT</span>
            </div>
            <p style={{ margin: '0.35rem 0 0.65rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Need ${Number(s.remainingToNextRank || 0).toFixed(2)} more team business to unlock this reward.
            </p>
            <div
              style={{
                height: 10,
                borderRadius: 999,
                background: 'rgba(42,51,71,0.95)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${nextProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #b8860b, #f7c02b)',
                  borderRadius: 999,
                }}
              />
            </div>
            <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Progress: {nextProgress}% toward ${Number(next.target).toLocaleString()}
            </div>
          </div>
        ) : (
          <p style={{ margin: '1rem 0 0', color: '#4ade80' }}>
            Top rank complete. Total rank rewards paid: ${(s.totalRankReward || 0).toFixed(2)} USDT
          </p>
        )}

        <div style={{ marginTop: '1rem' }}>
          <Link className="btn btn-primary" to="/rank-rewards">
            Open Rank & Rewards
          </Link>
        </div>
      </div>

      {/* Reward guide table */}
      <div className="card" style={{ padding: 0, marginBottom: '1rem', overflowX: 'auto' }}>
        <div style={{ padding: '1rem 1.25rem 0.5rem' }}>
          <h3 style={{ margin: 0, color: 'var(--accent)' }}>Rank Rewards Guide</h3>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            When your team builds this much business, you get this USDT reward (one-time per rank).
          </p>
        </div>
        <table className="mp-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team Business Target</th>
              <th>Your Reward</th>
              <th>Your Status</th>
            </tr>
          </thead>
          <tbody>
            {(s.ranks && s.ranks.length ? s.ranks : rankPlan).map((r) => {
              const paid = r.paid ?? (s.ranksClaimed || []).includes?.(r.rank);
              const unlocked = r.unlocked ?? teamBusiness >= r.target;
              return (
                <tr key={r.rank}>
                  <td>Rank {r.rank}{r.rank === 10 ? ' (Top)' : ''}</td>
                  <td>${Number(r.target).toLocaleString()}</td>
                  <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{r.reward} USDT</td>
                  <td style={{ color: paid ? '#4ade80' : unlocked ? '#fbbf24' : 'var(--text-muted)' }}>
                    {paid ? 'Paid' : unlocked ? 'Ready' : 'Locked'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ padding: '0.75rem 1.25rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          Example: if your team business reaches $5,000, you receive Rank 1 reward of 150 USDT.
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <h3 style={{ marginTop: 0, color: 'var(--accent)' }}>Your Team Referral Link</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>
          Share this link — new members register under your ID as sponsor.
        </p>
        <code style={{ color: 'var(--accent)', wordBreak: 'break-all', fontSize: '0.88rem' }}>{refLink}</code>
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
        <h3 style={{ marginTop: 0, color: 'var(--accent)' }}>Quick Actions</h3>
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
