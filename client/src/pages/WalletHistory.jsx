import { useEffect, useState } from 'react';
import api from '../api';

function formatType(type) {
  switch (type) {
    case 'admin_credit':
      return 'Fund Credit';
    case 'admin_debit':
      return 'Fund Debit';
    case 'deposit':
      return 'Deposit';
    case 'joining':
      return 'Package Activation';
    case 'roi':
      return 'Daily ROI';
    case 'direct_income':
      return 'Referral Income';
    case 'level_income':
      return 'Level Income';
    case 'salary_income':
      return 'Salary Income';
    case 'rank_reward':
      return 'Rank Reward';
    case 'fast_track_income':
      return 'Fast Track Income';
    case 'compound':
      return 'Manual Compound';
    case 'withdraw':
      return 'Withdrawal';
    case 'withdraw_reject':
      return 'Withdrawal Refunded';
    default:
      return String(type || '')
        .replace(/admin_/gi, 'fund_')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export default function WalletHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api
      .get('/wallet/history')
      .then((r) => setHistory(r.data.history || []))
      .catch(() => setHistory([]));
  }, []);

  return (
    <div>
      <h1 className="page-title">Wallet History</h1>
      <div className="card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.5rem' }}>Type</th>
              <th style={{ padding: '0.5rem' }}>Description</th>
              <th style={{ padding: '0.5rem' }}>Amount</th>
              <th style={{ padding: '0.5rem' }}>Status</th>
              <th style={{ padding: '0.5rem' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                  No transactions yet
                </td>
              </tr>
            )}
            {history.map((h) => {
              const cleanDesc = String(h.description || '')
                .replace(/admin fund credit/gi, 'Fund credit')
                .replace(/admin fund debit/gi, 'Fund debit')
                .replace(/admin/gi, 'system');

              const isDebit = h.type === 'admin_debit' || h.type === 'withdraw';

              return (
                <tr key={h._id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.65rem', fontWeight: 600 }}>{formatType(h.type)}</td>
                  <td style={{ padding: '0.65rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    {cleanDesc || formatType(h.type)}
                  </td>
                  <td style={{ padding: '0.65rem', color: isDebit ? '#ef4444' : 'var(--accent)', fontWeight: 700 }}>
                    {isDebit ? '-' : '+'}${Number(h.amount).toFixed(2)}
                  </td>
                  <td style={{ padding: '0.65rem' }}>
                    <span style={{ color: h.status === 'success' ? '#4ade80' : 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {h.status || 'success'}
                    </span>
                  </td>
                  <td style={{ padding: '0.65rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {new Date(h.createdAt).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
