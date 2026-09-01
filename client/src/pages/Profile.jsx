import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const rows = [
    ['Sponsor ID', user?.sponsorId],
    ['Name', user?.name],
    ['User ID', user?.userId],
    ['Email', user?.email],
    ['Mobile', user?.mobile],
    ['Country', user?.country],
    ['Wallet', user?.walletAddress],
    ['Joined', user?.isJoined ? 'Yes' : 'No'],
    ['Joining Date', user?.joinedAt ? new Date(user.joinedAt).toLocaleString() : '—'],
    ['Directs', user?.directCount ?? 0],
  ];

  return (
    <div>
      <h1 className="page-title">My Profile</h1>
      <div className="card" style={{ padding: '0.25rem 1.25rem' }}>
        {rows.map(([k, v]) => (
          <div
            key={k}
            style={{
              display: 'grid',
              gridTemplateColumns: '160px 1fr',
              gap: '0.75rem',
              padding: '0.9rem 0',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <strong>{k}</strong>
            <span style={{ color: 'var(--text-muted)', wordBreak: 'break-all' }}>{v || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
