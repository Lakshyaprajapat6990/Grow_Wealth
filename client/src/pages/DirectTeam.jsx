import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';

export default function DirectTeam() {
  const { user } = useAuth();
  const [team, setTeam] = useState([]);

  useEffect(() => {
    if (!user?.userId) return;
    api.get(`/user/direct-team/${user.userId}`).then((r) => setTeam(r.data.team || [])).catch(() => {});
  }, [user?.userId]);

  const refLink = `${window.location.origin}/register?ref=${user?.userId}`;

  return (
    <div>
      <PageHeader title="Direct Team" subtitle={`Total: ${team.length} direct referrals`} />
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <code style={{ color: '#60a5fa', wordBreak: 'break-all' }}>{refLink}</code>
        <button className="btn btn-ghost" style={{ marginTop: '0.5rem' }} onClick={() => navigator.clipboard.writeText(refLink)}>
          Copy Referral Link
        </button>
      </div>
      <DataTable
        columns={[
          { key: 'userId', label: 'User ID' },
          { key: 'name', label: 'Name' },
          { key: 'country', label: 'Country' },
          { key: 'joined', label: 'Joined', render: (r) => (r.isJoined ? 'Yes' : 'No') },
          { key: 'date', label: 'Date', render: (r) => new Date(r.createdAt).toLocaleDateString() },
        ]}
        rows={team}
      />
    </div>
  );
}
