import { useEffect, useState } from 'react';
import api from '../api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';

export default function LiveFeed() {
  const [data, setData] = useState({ deposits: [], stats: {} });

  useEffect(() => {
    const load = () => api.get('/feed/deposits/live-feed').then((r) => setData(r.data)).catch(() => {});
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <PageHeader title="System Live Feed" subtitle="Real-time platform deposit activity" />
      <div className="mp-stat-row">
        <div className="card mp-stat">
          <span>Total Investment</span>
          <strong>${Number(data.stats?.totalGrandInvestment || 0).toFixed(0)}</strong>
        </div>
        <div className="card mp-stat">
          <span>Today</span>
          <strong>${Number(data.stats?.todayTotalInvestment || 0).toFixed(0)}</strong>
        </div>
      </div>
      <DataTable
        columns={[
          { key: 'userId', label: 'User ID' },
          { key: 'name', label: 'Name' },
          { key: 'country', label: 'Country' },
          { key: 'amount', label: 'Amount', render: (r) => `$${Number(r.amount).toFixed(2)}` },
          { key: 'status', label: 'Status' },
          { key: 'date', label: 'Time', render: (r) => new Date(r.createdAt).toLocaleString() },
        ]}
        rows={data.deposits || []}
      />
    </div>
  );
}
