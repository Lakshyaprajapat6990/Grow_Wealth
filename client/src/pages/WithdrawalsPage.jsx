import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Withdraw from './Withdraw';

export default function WithdrawalsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    api.get('/wallet/withdrawals').then((r) => setRows(r.data.withdrawals || [])).catch(() => {});
  }, [showForm]);

  if (showForm) {
    return (
      <div>
        <PageHeader title="Request Withdrawal" subtitle="USDT BEP-20 to your wallet" />
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
        subtitle={user?.hasCompletedFirstWithdrawal ? 'Any amount allowed' : 'First withdrawal min $10'}
        action={
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            New Withdrawal
          </button>
        }
      />
      <DataTable
        columns={[
          { key: 'amount', label: 'Amount', render: (r) => `$${Number(r.amount).toFixed(2)}` },
          { key: 'status', label: 'Status' },
          { key: 'first', label: 'First?', render: (r) => (r.isFirstWithdrawal ? 'Yes' : 'No') },
          { key: 'wallet', label: 'Wallet', render: (r) => `${r.walletAddress?.slice(0, 8)}...` },
          { key: 'date', label: 'Date', render: (r) => new Date(r.createdAt).toLocaleString() },
        ]}
        rows={rows}
      />
    </div>
  );
}
