import { useEffect, useState } from 'react';
import api from '../api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';

export default function Trading() {
  const [prices, setPrices] = useState([]);

  useEffect(() => {
    const load = () => api.get('/market/prices').then((r) => setPrices(r.data.prices || [])).catch(() => {});
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <PageHeader title="Live Trading" subtitle="Crypto market prices (reference view)" />
      <DataTable
        columns={[
          { key: 'symbol', label: 'Symbol' },
          { key: 'price', label: 'Price', render: (r) => `$${Number(r.price).toFixed(4)}` },
          {
            key: 'change',
            label: '24h %',
            render: (r) => (
              <span style={{ color: r.change24h >= 0 ? '#4ade80' : '#f87171' }}>
                {r.change24h >= 0 ? '+' : ''}
                {r.change24h}%
              </span>
            ),
          },
        ]}
        rows={prices}
        emptyText="Loading market data..."
      />
    </div>
  );
}
