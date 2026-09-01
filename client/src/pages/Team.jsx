import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Team() {
  const { user } = useAuth();
  const [team, setTeam] = useState([]);

  useEffect(() => {
    if (!user?.userId) return;
    api
      .get(`/user/direct-team/${user.userId}`)
      .then((r) => setTeam(r.data.team || []))
      .catch(() => setTeam([]));
  }, [user?.userId]);

  const refLink = `${window.location.origin}/register?ref=${user?.userId || ''}`;

  return (
    <div>
      <h1 className="page-title">Direct Team</h1>
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <div className="label">Referral Link</div>
        <code style={{ color: 'var(--accent)', wordBreak: 'break-all' }}>{refLink}</code>
        <div style={{ marginTop: '0.75rem' }}>
          <button
            className="btn btn-ghost"
            onClick={() => navigator.clipboard.writeText(refLink)}
          >
            Copy Link
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.5rem' }}>User ID</th>
              <th style={{ padding: '0.5rem' }}>Name</th>
              <th style={{ padding: '0.5rem' }}>Joined</th>
              <th style={{ padding: '0.5rem' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {team.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                  No direct referrals yet
                </td>
              </tr>
            )}
            {team.map((t) => (
              <tr key={t.userId} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '0.65rem' }}>{t.userId}</td>
                <td style={{ padding: '0.65rem' }}>{t.name}</td>
                <td style={{ padding: '0.65rem' }}>{t.isJoined ? 'Yes' : 'No'}</td>
                <td style={{ padding: '0.65rem' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
