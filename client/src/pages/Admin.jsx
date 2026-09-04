import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function IncomeCreditForm({ onDone, setMsg, setErr }) {
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('direct');

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      const { data } = await api.post('/admin/income/credit', {
        userId: userId.trim().toUpperCase(),
        amount: Number(amount),
        incomeType: type,
      });
      setMsg(data.message);
      setUserId('');
      setAmount('');
      await onDone();
    } catch (error) {
      setErr(error.response?.data?.message || 'Income credit failed');
    }
  }

  return (
    <form className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }} onSubmit={submit}>
      <h3 style={{ marginTop: 0 }}>Credit Other Income</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
        <div className="field">
          <label className="label">User ID</label>
          <input className="input" value={userId} onChange={(e) => setUserId(e.target.value)} required />
        </div>
        <div className="field">
          <label className="label">Amount ($)</label>
          <input className="input" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div className="field">
          <label className="label">Type</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="direct">Direct</option>
            <option value="level">Level</option>
            <option value="salary">Monthly Salary</option>
            <option value="fast_track">Fast Track</option>
          </select>
        </div>
      </div>
      <button className="btn btn-primary">Credit Income</button>
    </form>
  );
}

function FundAdjustForm({ onDone, setMsg, setErr }) {
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [action, setAction] = useState('credit');
  const [remark, setRemark] = useState('');

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      const { data } = await api.post('/admin/fund/adjust', {
        userId: userId.trim().toUpperCase(),
        amount: Number(amount),
        action,
        remark,
      });
      setMsg(data.message);
      setUserId('');
      setAmount('');
      setRemark('');
      await onDone();
    } catch (error) {
      setErr(error.response?.data?.message || 'Fund adjust failed');
    }
  }

  return (
    <form className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }} onSubmit={submit}>
      <h3 style={{ marginTop: 0 }}>Fund Credit / Debit</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
        <div className="field">
          <label className="label">User ID</label>
          <input className="input" value={userId} onChange={(e) => setUserId(e.target.value)} required />
        </div>
        <div className="field">
          <label className="label">Amount ($)</label>
          <input className="input" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div className="field">
          <label className="label">Action</label>
          <select className="input" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="credit">Credit (+)</option>
            <option value="debit">Debit (−)</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label className="label">Remark</label>
        <input className="input" value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Optional note" />
      </div>
      <button className={`btn ${action === 'credit' ? 'btn-success' : 'btn-primary'}`}>
        {action === 'credit' ? 'Credit Fund' : 'Debit Fund'}
      </button>
    </form>
  );
}

export default function Admin() {
  const { logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [roiUserId, setRoiUserId] = useState('');
  const [roiBase, setRoiBase] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function load() {
    const [d, u, w, dep] = await Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/users'),
      api.get('/admin/withdrawals?status=pending'),
      api.get('/admin/deposits/pending'),
    ]);
    setStats(d.data.stats);
    setUsers(u.data.users || []);
    setWithdrawals(w.data.withdrawals || []);
    setDeposits(dep.data.deposits || []);
  }

  useEffect(() => {
    load().catch((e) => setErr(e.response?.data?.message || 'Failed to load admin'));
  }, []);

  async function creditRoi(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      const payload = { userId: roiUserId.trim().toUpperCase() };
      if (roiBase) payload.baseAmount = Number(roiBase);
      const { data } = await api.post('/admin/roi/credit', payload);
      setMsg(data.message);
      await load();
    } catch (error) {
      setErr(error.response?.data?.message || 'ROI credit failed');
    }
  }

  async function approve(id) {
    await api.post(`/admin/withdrawals/${id}/approve`);
    setMsg('Withdrawal approved / paid');
    await load();
  }

  async function approveDep(id) {
    setErr('');
    try {
      const { data } = await api.post(`/admin/deposits/${id}/approve`);
      setMsg(data.message);
      await load();
    } catch (error) {
      setErr(error.response?.data?.message || 'Approve failed');
    }
  }

  async function rejectDep(id) {
    setErr('');
    try {
      const { data } = await api.post(`/admin/deposits/${id}/reject`);
      setMsg(data.message);
      await load();
    } catch (error) {
      setErr(error.response?.data?.message || 'Reject failed');
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>
            Admin Panel
          </h1>
          <p className="page-sub">Live ops · Deposits · Fund credit/debit · ROI 1% · Withdrawals</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link className="btn btn-ghost" to="/dashboard">
            Member View
          </Link>
          <button className="btn btn-ghost" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {err && <div className="alert alert-error">{err}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="stat-grid" style={{ margin: '1rem 0 1.5rem' }}>
        <div className="card stat-card">
          <div className="label">Users</div>
          <div className="value">{stats?.totalUsers ?? '—'}</div>
        </div>
        <div className="card stat-card">
          <div className="label">Joined</div>
          <div className="value">{stats?.joinedUsers ?? '—'}</div>
        </div>
        <div className="card stat-card">
          <div className="label">Pending WD</div>
          <div className="value">{stats?.pendingWithdrawals ?? '—'}</div>
        </div>
        <div className="card stat-card">
          <div className="label">Total Deposited</div>
          <div className="value">${Number(stats?.totalDeposited || 0).toFixed(0)}</div>
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem', overflowX: 'auto' }}>
        <h3 style={{ marginTop: 0 }}>Pending Deposits (verify Tx → Credit)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.5rem' }}>User</th>
              <th style={{ padding: '0.5rem' }}>Amount</th>
              <th style={{ padding: '0.5rem' }}>Tx Hash</th>
              <th style={{ padding: '0.5rem' }}>Time</th>
              <th style={{ padding: '0.5rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {deposits.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                  No pending deposits
                </td>
              </tr>
            )}
            {deposits.map((d) => (
              <tr key={d._id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '0.65rem' }}>{d.userId}</td>
                <td style={{ padding: '0.65rem' }}>${Number(d.amount).toFixed(2)}</td>
                <td style={{ padding: '0.65rem', maxWidth: 180, wordBreak: 'break-all', fontSize: '0.8rem' }}>
                  {d.meta?.txHash || '—'}
                </td>
                <td style={{ padding: '0.65rem', fontSize: '0.85rem' }}>{new Date(d.createdAt).toLocaleString()}</td>
                <td style={{ padding: '0.65rem', display: 'flex', gap: '0.4rem' }}>
                  <button className="btn btn-success" type="button" onClick={() => approveDep(d._id)}>
                    Approve
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={() => rejectDep(d._id)}>
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FundAdjustForm onDone={load} setMsg={setMsg} setErr={setErr} />

      <form className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }} onSubmit={creditRoi}>
        <h3 style={{ marginTop: 0 }}>Manual ROI Credit (1% · 24/7)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="field">
            <label className="label">User ID</label>
            <input className="input" value={roiUserId} onChange={(e) => setRoiUserId(e.target.value)} required />
          </div>
          <div className="field">
            <label className="label">Base Amount (optional)</label>
            <input className="input" type="number" value={roiBase} onChange={(e) => setRoiBase(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary">Credit 1% ROI</button>
      </form>

      <IncomeCreditForm onDone={load} setMsg={setMsg} setErr={setErr} />

      <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem', overflowX: 'auto' }}>
        <h3 style={{ marginTop: 0 }}>Pending Withdrawals</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.5rem' }}>User</th>
              <th style={{ padding: '0.5rem' }}>Amount</th>
              <th style={{ padding: '0.5rem' }}>Wallet</th>
              <th style={{ padding: '0.5rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                  No pending withdrawals
                </td>
              </tr>
            )}
            {withdrawals.map((w) => (
              <tr key={w._id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '0.65rem' }}>{w.userId}</td>
                <td style={{ padding: '0.65rem' }}>${Number(w.amount).toFixed(2)}</td>
                <td style={{ padding: '0.65rem', maxWidth: 160, wordBreak: 'break-all', fontSize: '0.8rem' }}>
                  {w.walletAddress}
                </td>
                <td style={{ padding: '0.65rem' }}>
                  <button className="btn btn-success" type="button" onClick={() => approve(w._id)}>
                    Mark Paid
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
        <h3 style={{ marginTop: 0 }}>Users</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.5rem' }}>ID</th>
              <th style={{ padding: '0.5rem' }}>Name</th>
              <th style={{ padding: '0.5rem' }}>Sponsor</th>
              <th style={{ padding: '0.5rem' }}>Joined</th>
              <th style={{ padding: '0.5rem' }}>Fund</th>
              <th style={{ padding: '0.5rem' }}>Income</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.userId} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '0.65rem' }}>{u.userId}</td>
                <td style={{ padding: '0.65rem' }}>{u.name}</td>
                <td style={{ padding: '0.65rem' }}>{u.sponsorId || '—'}</td>
                <td style={{ padding: '0.65rem' }}>{u.isJoined ? 'Yes' : 'No'}</td>
                <td style={{ padding: '0.65rem' }}>${Number(u.fundBalance || 0).toFixed(2)}</td>
                <td style={{ padding: '0.65rem' }}>${Number(u.incomeBalance || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
