import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';

export default function AllTeam() {
  const { user } = useAuth();
  const [data, setData] = useState({ team: [], directCount: 0, totalTeamCount: 0 });

  useEffect(() => {
    if (!user?.userId) return;
    api.get(`/user/all-team/${user.userId}`).then((r) => setData(r.data)).catch(() => {});
  }, [user?.userId]);

  return (
    <div>
      <PageHeader
        title="Level Team"
        subtitle={`Direct: ${data.directCount} · Total downline: ${data.totalTeamCount}`}
      />
      <DataTable
        columns={[
          { key: 'userId', label: 'User ID' },
          { key: 'name', label: 'Name' },
          { key: 'sponsorId', label: 'Sponsor' },
          { key: 'joined', label: 'Joined', render: (r) => (r.isJoined ? 'Yes' : 'No') },
          { key: 'date', label: 'Date', render: (r) => new Date(r.createdAt).toLocaleDateString() },
        ]}
        rows={data.team || []}
      />
    </div>
  );
}
