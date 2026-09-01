import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

export default function MyAccount() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader title="My Account" subtitle="Account status and quick links" />
      <div className="dash-grid">
        <div className="card dash-card">
          <div className="label">Status</div>
          <div className="value" style={{ color: user?.isJoined ? '#4ade80' : '#fbbf24', fontSize: '1.1rem' }}>
            {user?.isJoined ? 'Joined' : 'Not Joined'}
          </div>
        </div>
        <div className="card dash-card">
          <div className="label">Fund Balance</div>
          <div className="value">${(user?.fundBalance || 0).toFixed(2)}</div>
        </div>
        <div className="card dash-card green">
          <div className="label">Income Balance</div>
          <div className="value">${(user?.incomeBalance || 0).toFixed(2)}</div>
        </div>
        <div className="card dash-card">
          <div className="label">Total Deposited</div>
          <div className="value">${(user?.totalDeposited || 0).toFixed(2)}</div>
        </div>
      </div>
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ marginTop: 0, color: '#93c5fd' }}>Actions</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
          <Link className="btn btn-primary" to="/deposit">Deposit USDT</Link>
          {!user?.isJoined && <Link className="btn btn-success" to="/join">Activate $1 Joining</Link>}
          <Link className="btn btn-ghost" to="/withdrawals">Withdraw</Link>
          <Link className="btn btn-ghost" to="/profile">View Profile</Link>
        </div>
      </div>
    </div>
  );
}
