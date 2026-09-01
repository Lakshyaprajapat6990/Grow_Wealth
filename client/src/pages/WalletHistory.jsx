import { useEffect, useState } from 'react';
import api from '../api';

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
              <th style={{ padding: '0.5rem' }}>Amount</th>
              <th style={{ padding: '0.5rem' }}>Status</th>
              <th style={{ padding: '0.5rem' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                  No transactions yet
                </td>
              </tr>
            )}
            {history.map((h) => (
              <tr key={h._id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '0.65rem' }}>{h.type}</td>
                <td style={{ padding: '0.65rem', color: 'var(--accent)' }}>${Number(h.amount).toFixed(2)}</td>
                <td style={{ padding: '0.65rem' }}>{h.status}</td>
                <td style={{ padding: '0.65rem' }}>{new Date(h.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
