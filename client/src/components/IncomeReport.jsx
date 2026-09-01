import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import PageHeader from './PageHeader';
import DataTable from './DataTable';

export default function IncomeReport({ title, subtitle, type, totalLabel }) {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!user?.userId) return;
    api
      .get(`/transaction/${user.userId}?type=${type}`)
      .then((r) => {
        setRows(r.data.transactions || []);
        setTotal(r.data.total || 0);
      })
      .catch(() => setRows([]));
  }, [user?.userId, type]);

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <div className="mp-stat-row">
        <div className="card mp-stat">
          <span>{totalLabel}</span>
          <strong>${total.toFixed(2)}</strong>
        </div>
      </div>
      <DataTable
        columns={[
          { key: 'date', label: 'Date', render: (r) => new Date(r.createdAt).toLocaleString() },
          { key: 'amount', label: 'Amount', render: (r) => `$${Number(r.amount).toFixed(2)}` },
          { key: 'status', label: 'Status' },
          { key: 'description', label: 'Description' },
        ]}
        rows={rows}
        emptyText={`No ${title.toLowerCase()} records yet`}
      />
    </div>
  );
}
