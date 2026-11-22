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

  const teamVol = Number(status?.teamVolume || 0);
  const directVol = Number(status?.directVolume || 0);
  const directReq = Number(status?.directRequired || 500);
  const directRem = Number(status?.directRemaining || Math.max(0, directReq - directVol));
  const isDirectOk = !!status?.directQualified || directVol >= directReq;
  const isTeamOk = teamVol >= 3000;
  const isFullyUnlocked = isTeamOk && isDirectOk;

  return (
    <div>
      <PageHeader
        title="Salary Income"
        subtitle="Downline team business and direct referral business unlock a daily salary installment (divided across 30 days)."
      />

      {err && <div className="alert alert-error">{err}</div>}

      {/* Qualification Alert Banners */}
      {status && !isDirectOk && (
        <div
          className="card"
          style={{
            padding: '1rem 1.25rem',
            marginBottom: '1rem',
            borderColor: 'rgba(247, 192, 43, 0.45)',
            background: 'rgba(247, 192, 43, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent)', fontWeight: 700 }}>
            <span>⚠️</span>
            <span>Direct Business Condition: $500 USDT Required</span>
          </div>
          <p style={{ margin: '0.4rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            To unlock and receive your daily salary income, you must achieve at least <strong>$500.00 USDT</strong> in direct business through your personal refer link.
          </p>
          <div style={{ marginTop: '0.6rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.88rem' }}>
            <span style={{ color: '#fff' }}>
              Current Direct: <strong>${directVol.toFixed(2)}</strong> / ${directReq.toFixed(2)}
            </span>
            <span style={{ color: 'var(--accent)' }}>
              Remaining: <strong>${directRem.toFixed(2)} USDT</strong>
            </span>
          </div>
        </div>
      )}

      {status && isFullyUnlocked && (
        <div
          className="alert alert-success"
          style={{
            marginBottom: '1rem',
            background: 'rgba(74, 222, 128, 0.1)',
            borderColor: 'rgba(74, 222, 128, 0.4)',
            color: '#4ade80',
          }}
        >
          🎉 <strong>Salary & Daily Withdrawals Active!</strong> You have achieved both <strong>$3,000+ Downline Business</strong> and <strong>$500+ Direct Referral Business</strong>. Daily salary installment is credited every day.
        </div>
      )}

      {status && (
        <div className="mp-stat-row">
          <div className="card mp-stat">
            <span>Salary Tier</span>
            <strong style={{ color: isFullyUnlocked ? '#4ade80' : 'var(--text-muted)' }}>
              {status.salaryTier || 0}
              {!isFullyUnlocked && teamVol >= 3000 ? (
                <span style={{ fontSize: '0.72rem', color: '#f7c02b', display: 'block' }}>Needs $500 Direct</span>
              ) : null}
            </strong>
          </div>
          <div className="card mp-stat">
            <span>Team Business</span>
            <strong>${teamVol.toFixed(2)}</strong>
          </div>
          <div className="card mp-stat">
            <span>Direct Refer Business</span>
            <strong style={{ color: isDirectOk ? '#4ade80' : '#f7c02b' }}>
              ${directVol.toFixed(2)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ $500</span>
            </strong>
          </div>
          <div className="card mp-stat">
            <span>Daily Payout</span>
            <strong style={{ color: '#4ade80' }}>
              ${Number(status.dailyAmount || 0).toFixed(2)}{' '}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ day</span>
            </strong>
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
                <th>Direct Required</th>
                <th>Daily Payout</th>
                <th>Monthly Total</th>
                <th>Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {status.tiers.map((t) => {
                let badgeText = 'Locked';
                let badgeColor = 'var(--text-muted)';

                if (t.isCurrent) {
                  badgeText = 'Current Active';
                  badgeColor = '#4ade80';
                } else if (t.unlocked) {
                  badgeText = 'Qualified';
                  badgeColor = '#fbbf24';
                } else if (t.teamQualified && !isDirectOk) {
                  badgeText = 'Needs $500 Direct';
                  badgeColor = '#f59e0b';
                }

                return (
                  <tr key={t.tier}>
                    <td>
                      Tier {t.tier}
                      {t.tier === 6 ? ' (Top)' : ''}
                    </td>
                    <td>${t.target.toLocaleString()}</td>
                    <td>${directReq} USDT</td>
                    <td style={{ color: '#4ade80', fontWeight: 'bold' }}>
                      ${Number(t.daily || t.monthly / 30).toFixed(2)} USDT / day
                    </td>
                    <td>${t.monthly} USDT / mo</td>
                    <td>{t.progressPercent}%</td>
                    <td style={{ color: badgeColor, fontWeight: 600 }}>{badgeText}</td>
                  </tr>
                );
              })}
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
