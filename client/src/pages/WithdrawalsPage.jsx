import { useEffect, useState } from 'react';
import api from '../api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Withdraw from './Withdraw';
import RefundFund from './RefundFund';

export default function WithdrawalsPage() {
  const [rows, setRows] = useState([]);
  const [mode, setMode] = useState(null); // null | 'income' | 'refund'

  useEffect(() => {
    api.get('/wallet/withdrawals').then((r) => setRows(r.data.withdrawals || [])).catch(() => {});
  }, [mode]);

  if (mode === 'income') {
    return (
      <div>
        <PageHeader title="Withdraw Income" subtitle="Income only · Min $10 · 10% fee · 24–48h process" />
        <button className="btn btn-ghost" style={{ marginBottom: '1rem' }} onClick={() => setMode(null)}>
          ← Back to History
        </button>
        <Withdraw />
      </div>
    );
  }

  if (mode === 'refund') {
    return (
      <div>
        <PageHeader title="Refund Fund" subtitle="Fund Balance only · Min $10 · 20% fee · 24–48h process" />
        <button className="btn btn-ghost" style={{ marginBottom: '1rem' }} onClick={() => setMode(null)}>
          ← Back to History
        </button>
        <RefundFund />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Withdrawals"
        subtitle="Income 10% · Fund refund 20% · max 1 request per day"
        action={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setMode('income')}>
              Withdraw Income
            </button>
            <button className="btn btn-ghost" onClick={() => setMode('refund')}>
              Refund Fund
            </button>
          </div>
        }
      />
      <DataTable
        columns={[
          {
            key: 'kind',
            label: 'Type',
            render: (r) => (r.kind === 'fund_refund' ? 'Fund Refund' : 'Income'),
          },
          {
            key: 'requested',
            label: 'Requested',
            render: (r) => `$${Number(r.requestedAmount ?? r.amount).toFixed(2)}`,
          },
          { key: 'fee', label: 'Fee', render: (r) => `$${Number(r.fee || 0).toFixed(2)}` },
          { key: 'amount', label: 'Net', render: (r) => `$${Number(r.amount).toFixed(2)}` },
          { key: 'status', label: 'Status' },
          { key: 'wallet', label: 'Wallet', render: (r) => `${r.walletAddress?.slice(0, 8)}...` },
          { key: 'date', label: 'Date', render: (r) => new Date(r.createdAt).toLocaleString() },
        ]}
        rows={rows}
      />
    </div>
  );
}
