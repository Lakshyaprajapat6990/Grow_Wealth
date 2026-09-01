import { useEffect, useState } from 'react';
import api from '../api';
import PageHeader from '../components/PageHeader';

export default function Notifications() {
  const [list, setList] = useState([]);

  useEffect(() => {
    api.get('/notifications/me').then((r) => setList(r.data.notifications || [])).catch(() => {});
    api.post('/notifications/mark-read').catch(() => {});
  }, []);

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Platform alerts and announcements" />
      {list.length === 0 && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#8ba3c7' }}>
          No notifications yet
        </div>
      )}
      {list.map((n) => (
        <div key={n._id} className="card" style={{ padding: '1rem', marginBottom: '0.65rem', opacity: n.isRead ? 0.7 : 1 }}>
          <strong style={{ color: '#93c5fd' }}>{n.title}</strong>
          <p style={{ margin: '0.35rem 0 0', color: '#8ba3c7' }}>{n.message}</p>
          <small style={{ color: '#5a7aa5' }}>{new Date(n.createdAt).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
}
