import { useEffect, useState } from 'react';
import api from '../api';
import PageHeader from '../components/PageHeader';
import IncomeReport from '../components/IncomeReport';

export default function RankRewards() {
  const [status, setStatus] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api
      .get('/user/rank-status')
      .then((r) => setStatus(r.data))
      .catch((e) => setErr(e.response?.data?.message || 'Failed to load rank status'));
  }, []);

  return (
    <div>
      <PageHeader
        title="Rank & Rewards"
        subtitle="Dual qualification: Downline Team Business + Direct Referral Business unlocks USDT rewards."
      />

      {err && <div className="alert alert-error">{err}</div>}

      {status && (
        <div className="mp-stat-row">
          <div className="card mp-stat">
            <span>Current Rank</span>
            <strong>{status.currentRank || 0}</strong>
          </div>
          <div className="card mp-stat">
            <span>Team Business</span>
            <strong>${Number(status.teamVolume || 0).toFixed(2)}</strong>
          </div>
          <div className="card mp-stat">
            <span>Direct Business</span>
            <strong style={{ color: 'var(--accent)' }}>${Number(status.directVolume || 0).toFixed(2)}</strong>
            <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{status.directCount || 0} Direct Members</small>
          </div>
          <div className="card mp-stat">
            <span>Team Size</span>
            <strong>{status.teamSize || 0}</strong>
          </div>
          <div className="card mp-stat">
            <span>Total Rank Rewards</span>
            <strong style={{ color: '#4ade80' }}>${Number(status.totalRankReward || 0).toFixed(2)}</strong>
          </div>
        </div>
      )}

      {status?.nextRank && (
        <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1rem', borderColor: 'rgba(247,192,43,0.35)' }}>
          <strong style={{ color: 'var(--accent)', fontSize: '1rem' }}>
            Next: Rank {status.nextRank.rank} — Reward: {status.nextRank.reward} USDT
          </strong>
          <div style={{ marginTop: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', fontSize: '0.88rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.8rem', borderRadius: 8 }}>
              <div style={{ color: 'var(--text-muted)' }}>Downline Team Target:</div>
              <strong style={{ fontSize: '0.98rem' }}>${status.nextRank.target.toLocaleString()} USDT</strong>
              <div style={{ color: status.remainingToNext > 0 ? '#fbbf24' : '#4ade80', marginTop: '0.2rem' }}>
                {status.remainingToNext > 0 ? `Need $${Number(status.remainingToNext).toFixed(2)} more` : '✓ Team Target Met'}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.8rem', borderRadius: 8 }}>
              <div style={{ color: 'var(--text-muted)' }}>Direct Referral Target (13%):</div>
              <strong style={{ fontSize: '0.98rem' }}>${Number(status.nextRank.directTarget || 0).toLocaleString()} USDT</strong>
              <div style={{ color: status.remainingDirectToNext > 0 ? '#fbbf24' : '#4ade80', marginTop: '0.2rem' }}>
                {status.remainingDirectToNext > 0 ? `Need $${Number(status.remainingDirectToNext).toFixed(2)} more direct` : '✓ Direct Target Met'}
              </div>
            </div>
          </div>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Example: Rank 1 requires $5,000 Team Business and $650 Direct Business for a 150 USDT reward.
          </p>
        </div>
      )}

      {status?.ranks && (
        <div className="card" style={{ padding: 0, marginBottom: '1.25rem', overflowX: 'auto' }}>
          <table className="mp-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team Target</th>
                <th>Direct Target (13%)</th>
                <th>Reward</th>
                <th>Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {status.ranks.map((r) => (
                <tr key={r.rank}>
                  <td>Rank {r.rank}{r.rank === 10 ? ' (Top)' : ''}</td>
                  <td>${r.target.toLocaleString()}</td>
                  <td style={{ color: 'var(--accent)' }}>${Number(r.directTarget || 0).toLocaleString()}</td>
                  <td style={{ fontWeight: 700, color: '#4ade80' }}>{r.reward} USDT</td>
                  <td style={{ fontSize: '0.82rem' }}>
                    <div>Team: {r.progressPercent}%</div>
                    <div>Direct: {r.directProgressPercent}%</div>
                  </td>
                  <td style={{ fontWeight: 600, color: r.paid ? '#4ade80' : r.unlocked ? '#4ade80' : r.pendingDirect ? '#fbbf24' : 'var(--text-muted)' }}>
                    {r.paid ? 'Paid' : r.unlocked ? 'Ready' : r.pendingDirect ? `Need $${Number(r.directRemaining || 0).toLocaleString()} Direct` : 'Locked'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <IncomeReport
        title="Rank Reward History"
        subtitle="One-time USDT bonus when your team volume hits each rank target"
        type="rank_reward"
        totalLabel="Paid Rank Rewards"
      />
    </div>
  );
}
