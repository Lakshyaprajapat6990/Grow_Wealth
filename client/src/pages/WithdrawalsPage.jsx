import { useEffect, useState } from 'react';
import api from '../api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Withdraw from './Withdraw';

export default function WithdrawalsPage() {
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    api.get('/wallet/withdrawals').then((r) => setRows(r.data.withdrawals || [])).catch(() => {});
  }, [showForm]);

  if (showForm) {
    return (
      <div>
        <PageHeader title="Request Withdrawal" subtitle="Min $10 · 10% fee · USDT BEP-20" />
        <button className="btn btn-ghost" style={{ marginBottom: '1rem' }} onClick={() => setShowForm(false)}>
          ← Back to History
        </button>
        <Withdraw />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Withdrawals"
        subtitle="Min $10 · 10% fee on every withdrawal"
        action={
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            New Withdrawal
          </button>
        }
      />
      <DataTable
        columns={[
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
