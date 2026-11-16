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
        title="Salary Income"
        subtitle="Downline team business unlocks a daily salary installment (monthly reward divided across 30 days)."
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
            <span>Daily Payout</span>
            <strong style={{ color: '#4ade80' }}>
              ${Number(status.dailyAmount || 0).toFixed(2)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ day</span>
            </strong>
          </div>
          <div className="card mp-stat">
            <span>Monthly Equivalent</span>
            <strong>${Number(status.monthlyAmount || 0).toFixed(0)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ mo</span></strong>
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
            {Number(status.nextTier.daily || status.nextTier.monthly / 30).toFixed(2)}/day (${status.nextTier.monthly}/mo)
          </strong>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)' }}>
            Need ${Number(status.remainingToNext || 0).toFixed(2)} more team business. Paid daily while you stay qualified.
          </p>
        </div>
      )}

      {status?.currentTier && status.paidToday && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
          ✓ Today's salary installment ({status.currentDay}) already credited ($
          {Number(status.dailyAmount || status.currentTier.daily || 6).toFixed(2)} USDT).
        </div>
      )}

      {status?.tiers && (
        <div className="card" style={{ padding: 0, marginBottom: '1.25rem', overflowX: 'auto' }}>
          <table className="mp-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>Team Business</th>
                <th>Daily Payout</th>
                <th>Monthly Total</th>
                <th>Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {status.tiers.map((t) => (
                <tr key={t.tier}>
                  <td>Tier {t.tier}{t.tier === 6 ? ' (Top)' : ''}</td>
                  <td>${t.target.toLocaleString()}</td>
                  <td style={{ color: '#4ade80', fontWeight: 'bold' }}>
                    ${Number(t.daily || t.monthly / 30).toFixed(2)} USDT / day
                  </td>
                  <td>${t.monthly} USDT / mo</td>
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
        subtitle="Daily salary installment credits from your downline team business"
        type="salary"
        totalLabel="Total Salary Income"
      />
    </div>
  );
}
