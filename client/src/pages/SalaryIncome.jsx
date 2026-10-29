import { useEffect, useState } from 'react';
import api from '../api';
import PageHeader from '../components/PageHeader';
import IncomeReport from '../components/IncomeReport';

export default function SalaryIncome() {
  const [status, setStatus] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api
      .get('/user/salary-status')
      .then((r) => setStatus(r.data))
      .catch((e) => setErr(e.response?.data?.message || 'Failed to load salary status'));
  }, []);

  return (
    <div>
      <PageHeader
        title="Monthly Salary"
        subtitle="Downline team business unlocks a monthly USDT salary."
      />

      {err && <div className="alert alert-error">{err}</div>}

      {status && (
        <div className="mp-stat-row">
          <div className="card mp-stat">
            <span>Salary Tier</span>
            <strong>{status.salaryTier || 0}</strong>
          </div>
          <div className="card mp-stat">
            <span>Team Business</span>
            <strong>${Number(status.teamVolume || 0).toFixed(2)}</strong>
          </div>
          <div className="card mp-stat">
            <span>Monthly Amount</span>
            <strong>${Number(status.monthlyAmount || 0).toFixed(0)}</strong>
          </div>
          <div className="card mp-stat">
            <span>Months Paid</span>
            <strong>{status.salaryMonthsPaid || 0}</strong>
          </div>
        </div>
      )}

      {status?.nextTier && (
        <div
          className="card"
          style={{ padding: '1rem 1.25rem', marginBottom: '1rem', borderColor: 'rgba(247,192,43,0.35)' }}
        >
          <strong style={{ color: 'var(--accent)' }}>
            Next: Tier {status.nextTier.tier} at ${status.nextTier.target.toLocaleString()} team business → $
            {status.nextTier.monthly}/month
          </strong>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)' }}>
            Need ${Number(status.remainingToNext || 0).toFixed(2)} more. Paid once per month while you stay qualified.
          </p>
        </div>
      )}

      {status?.currentTier && status.paidThisMonth && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
          Salary for {status.currentPeriod} already credited (${status.currentTier.monthly} USDT).
        </div>
      )}

      {status?.tiers && (
        <div className="card" style={{ padding: 0, marginBottom: '1.25rem', overflowX: 'auto' }}>
          <table className="mp-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>Team Business</th>
                <th>Monthly Salary</th>
                <th>Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {status.tiers.map((t) => (
                <tr key={t.tier}>
                  <td>Tier {t.tier}{t.tier === 6 ? ' (Top)' : ''}</td>
                  <td>${t.target.toLocaleString()}</td>
                  <td>${t.monthly} USDT</td>
                  <td>{t.progressPercent}%</td>
                  <td
                    style={{
                      color: t.isCurrent ? '#4ade80' : t.unlocked ? '#fbbf24' : 'var(--text-muted)',
                    }}
                  >
                    {t.isCurrent ? 'Current' : t.unlocked ? 'Qualified' : 'Locked'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <IncomeReport
        title="Salary Income History"
        subtitle="Monthly salary credits from your downline team business"
        type="salary"
        totalLabel="Total Salary Income"
      />
    </div>
  );
}
