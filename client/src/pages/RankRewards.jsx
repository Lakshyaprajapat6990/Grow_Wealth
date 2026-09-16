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
        subtitle="Your team business (downline deposits) unlocks USDT rewards. Team size does not matter."
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
            <span>Team Size</span>
            <strong>{status.teamSize || 0}</strong>
          </div>
          <div className="card mp-stat">
            <span>Total Rank Rewards</span>
            <strong>${Number(status.totalRankReward || 0).toFixed(2)}</strong>
          </div>
        </div>
      )}

      {status?.nextRank && (
        <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1rem', borderColor: 'rgba(247,192,43,0.35)' }}>
          <strong style={{ color: 'var(--accent)' }}>
            Next: Rank {status.nextRank.rank} when team business hits ${status.nextRank.target.toLocaleString()}
          </strong>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)' }}>
            Need ${Number(status.remainingToNext || 0).toFixed(2)} more for {status.nextRank.reward} USDT reward.
            Example: $5,000 team business = Rank 1 = 150 USDT.
          </p>
        </div>
      )}

      {status?.ranks && (
        <div className="card" style={{ padding: 0, marginBottom: '1.25rem', overflowX: 'auto' }}>
          <table className="mp-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team Business</th>
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
                  <td>{r.reward} USDT</td>
                  <td>{r.progressPercent}%</td>
                  <td style={{ color: r.paid ? '#4ade80' : r.unlocked ? '#fbbf24' : 'var(--text-muted)' }}>
                    {r.paid ? 'Paid' : r.unlocked ? 'Ready' : 'Locked'}
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
