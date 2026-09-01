import { useEffect, useState } from 'react';
import api from '../api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';

export default function DepositHistory() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api
      .get('/wallet/history')
      .then((r) => setRows((r.data.history || []).filter((h) => h.type === 'deposit')))
      .catch(() => setRows([]));
  }, []);

  return (
    <div>
      <PageHeader title="Deposit History" subtitle="All USDT BEP-20 deposits" />
      <DataTable
        columns={[
          { key: 'date', label: 'Date', render: (r) => new Date(r.createdAt).toLocaleString() },
          { key: 'amount', label: 'Amount', render: (r) => `$${Number(r.amount).toFixed(2)}` },
          { key: 'status', label: 'Status' },
          { key: 'hash', label: 'Tx Hash', render: (r) => r.meta?.txHash || '—' },
        ]}
        rows={rows}
      />
    </div>
  );
}
