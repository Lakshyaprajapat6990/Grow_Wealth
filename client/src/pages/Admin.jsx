import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import TeamHierarchy from './TeamHierarchy';

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
      <div className="form-grid-3">
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
            <option value="direct">Direct (Refer & Earn)</option>
            <option value="salary">Salary Income</option>
            <option value="fast_track">Fast Track</option>
          </select>
        </div>
      </div>
      <button className="btn btn-primary">Credit Income</button>
    </form>
  );
}

function CreateMemberAdminForm({ onDone, setMsg, setErr }) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [sponsorId, setSponsorId] = useState('');
  const [password, setPassword] = useState('');
  const [trxPassword, setTrxPassword] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [depositAmount, setDepositAmount] = useState('10');
  const [loading, setLoading] = useState(false);
  const [createdMember, setCreatedMember] = useState(null);
  const [copied, setCopied] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    setLoading(true);
    setCreatedMember(null);
    setCopied(false);
    try {
      const { data } = await api.post('/admin/users/create', {
        name,
        mobile,
        email: email.trim(),
        sponsorId: sponsorId.trim().toUpperCase(),
        password,
        transactionPassword: trxPassword,
        walletAddress: walletAddress.trim(),
        depositAmount: Number(depositAmount) || 0,
      });

      setMsg(data.message);
      setCreatedMember(data.member);
      setName('');
      setMobile('');
      setEmail('');
      setSponsorId('');
      setPassword('');
      setTrxPassword('');
      setWalletAddress('');
      setDepositAmount('10');
      await onDone();
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to create member');
    } finally {
      setLoading(false);
    }
  }

  function copyCredentials() {
    if (!createdMember) return;
    const text =
      `🎉 Grow Wealth Account Created!\n` +
      `User ID: ${createdMember.userId}\n` +
      `Name: ${createdMember.name}\n` +
      `Login Password: ${createdMember.passwordPlain}\n` +
      `Transaction Password: ${createdMember.transactionPasswordPlain}\n` +
      `Sponsor: ${createdMember.sponsorId} (${createdMember.sponsorName})\n` +
      `Deposit Package: $${createdMember.depositAmount} USDT\n` +
      `Login URL: https://grow-wealth-neon.vercel.app/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  return (
    <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem', borderLeft: '4px solid var(--accent)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--accent)' }}>Create New Member ID</h3>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Directly register and activate an ID under any sponsor with custom deposit amount.
          </p>
        </div>
      </div>

      <form onSubmit={submit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div className="field">
            <label className="label">Full Name *</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rahul Sharma" required />
          </div>

          <div className="field">
            <label className="label">Mobile Number *</label>
            <input className="input" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="e.g. 9876543210" required />
          </div>

          <div className="field">
            <label className="label">Sponsor ID (optional)</label>
            <input className="input" value={sponsorId} onChange={(e) => setSponsorId(e.target.value)} placeholder="Default: GW0000001 (Admin)" />
          </div>

          <div className="field">
            <label className="label">Initial Package / Deposit ($)</label>
            <input className="input" type="number" min="0" step="1" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="e.g. 10, 40, 100" />
          </div>

          <div className="field">
            <label className="label">Registered Email (optional)</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Auto-generated if empty" />
          </div>

          <div className="field">
            <label className="label">Login Password (optional)</label>
            <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Default: name@123" />
          </div>

          <div className="field">
            <label className="label">Transaction Password (optional)</label>
            <input className="input" value={trxPassword} onChange={(e) => setTrxPassword(e.target.value)} placeholder="Default: 6-digit PIN" />
          </div>

          <div className="field">
            <label className="label">BEP-20 Wallet Address (optional)</label>
            <input className="input" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="0x... (auto-filled if empty)" />
          </div>
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading} style={{ fontWeight: 'bold' }}>
          {loading ? 'Creating Member ID…' : '+ Create & Activate Member ID'}
        </button>
      </form>

      {createdMember && (
        <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h4 style={{ margin: 0, color: '#4ade80' }}>✓ Member Created Successfully!</h4>
            <button className="btn btn-ghost" type="button" onClick={copyCredentials} style={{ fontSize: '0.85rem' }}>
              {copied ? '✓ Copied to Clipboard!' : '📋 Copy All Details'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div><span style={{ color: 'var(--text-muted)' }}>User ID:</span> <strong>{createdMember.userId}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Name:</span> <strong>{createdMember.name}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Login Password:</span> <strong>{createdMember.passwordPlain}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Trx Password:</span> <strong>{createdMember.transactionPasswordPlain}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Sponsor ID:</span> <strong>{createdMember.sponsorId}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Deposit:</span> <strong>${createdMember.depositAmount} USDT</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Status:</span> <strong style={{ color: createdMember.isJoined ? '#4ade80' : '#fbbf24' }}>{createdMember.isJoined ? 'Joined & Active' : 'Not Joined'}</strong></div>
          </div>
        </div>
      )}
    </div>
  );
}

function FundAdjustForm({ onDone, setMsg, setErr }) {
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [action, setAction] = useState('credit');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }} onSubmit={submit}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h3 style={{ margin: 0 }}>Direct Add / Deduct Fund Balance</h3>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Directly top-up (+ credit) or reduce (− debit) any member's fund balance with live audit tracking.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className={`btn ${action === 'credit' ? 'btn-success' : 'btn-ghost'}`}
            style={{ fontWeight: action === 'credit' ? 'bold' : 'normal' }}
            onClick={() => setAction('credit')}
          >
            + Add Fund (Credit)
          </button>
          <button
            type="button"
            className={`btn ${action === 'debit' ? 'btn-danger' : 'btn-ghost'}`}
            style={{
              fontWeight: action === 'debit' ? 'bold' : 'normal',
              background: action === 'debit' ? '#ef4444' : undefined,
              color: action === 'debit' ? '#fff' : undefined,
            }}
            onClick={() => setAction('debit')}
          >
            − Deduct Fund (Debit)
          </button>
        </div>
      </div>

      <div className="form-grid-3">
        <div className="field">
          <label className="label">Target Member User ID *</label>
          <input
            className="input"
            value={userId}
            onChange={(e) => setUserId(e.target.value.toUpperCase())}
            placeholder="e.g. GW1234567"
            required
          />
        </div>
        <div className="field">
          <label className="label">Amount ($ USDT) *</label>
          <input
            className="input"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 50"
            required
          />
        </div>
        <div className="field">
          <label className="label">Action Type</label>
          <select className="input" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="credit">+ Add / Credit Fund (+)</option>
            <option value="debit">− Deduct / Debit Fund (−)</option>
          </select>
        </div>
      </div>
      <div className="field" style={{ marginTop: '0.5rem' }}>
        <label className="label">Reason / Remark (optional)</label>
        <input
          className="input"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder={action === 'credit' ? 'e.g. Direct top-up / package addition' : 'e.g. Admin withdrawal / correction'}
        />
      </div>
      <button
        className="btn"
        type="submit"
        disabled={loading}
        style={{
          marginTop: '0.75rem',
          fontWeight: 'bold',
          background: action === 'credit' ? '#22c55e' : '#ef4444',
          color: '#fff',
        }}
      >
        {loading
          ? 'Processing…'
          : action === 'credit'
          ? `+ Credit $${amount || '0'} USDT to ${userId || 'User'}`
          : `− Deduct $${amount || '0'} USDT from ${userId || 'User'}`}
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
  const [hierarchyFocus, setHierarchyFocus] = useState('');
  const [historyUser, setHistoryUser] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [roiRunning, setRoiRunning] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [sortMode, setSortMode] = useState('newest');
  const [userPage, setUserPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  async function runDailyRoi() {
    if (roiRunning) return;
    setErr('');
    setMsg('');
    setRoiRunning(true);
    try {
      const { data } = await api.post('/admin/roi/run-daily');
      setMsg(data.message);
      await load();
    } catch (error) {
      setErr(error.response?.data?.message || 'Daily ROI run failed');
    } finally {
      setRoiRunning(false);
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

  async function grantLeaderIncentive(userId) {
    if (
      !window.confirm(
        `Grant ${userId} locked gift (manual)? Auto gift for new joins is $0. Continue only if you intend a manual grant.`
      )
    ) {
      return;
    }
    setErr('');
    setMsg('');
    try {
      const { data } = await api.post(`/admin/users/${userId}/leader-incentive`);
      setMsg(data.message);
      await load();
    } catch (e) {
      setErr(e.response?.data?.message || 'Gift grant failed');
    }
  }

  async function giftAllMembers() {
    if (
      !window.confirm(
        'Auto gift is $0 for new joins. Gift-all will do nothing unless env gift amount is set. Continue?'
      )
    ) {
      return;
    }
    setErr('');
    setMsg('');
    try {
      const { data } = await api.post('/admin/users/gift-all');
      setMsg(data.message);
      await load();
    } catch (e) {
      setErr(e.response?.data?.message || 'Gift all failed');
    }
  }

  async function openHistory(userId) {
    setHistoryLoading(true);
    setErr('');
    try {
      const { data } = await api.get(`/admin/users/${userId}/history`);
      setHistoryUser(data.user);
      setHistoryRows(data.history || []);
      setTimeout(() => document.getElementById('user-history-jump')?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (error) {
      setErr(error.response?.data?.message || 'History load failed');
    } finally {
      setHistoryLoading(false);
    }
  }

  const filteredUsers = users
    .filter((u) => {
      if (!userSearch) return true;
      const q = userSearch.toLowerCase().trim();
      return (
        (u.userId && u.userId.toLowerCase().includes(q)) ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.mobile && u.mobile.toLowerCase().includes(q)) ||
        (u.sponsorId && u.sponsorId.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortMode === 'business') {
        return Number(b.teamBusiness || 0) - Number(a.teamBusiness || 0);
      }
      return 0;
    });

  const totalFiltered = filteredUsers.length;
  const effectivePageSize = pageSize === 'all' ? (totalFiltered || 1) : Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(totalFiltered / effectivePageSize));
  const currentPage = Math.min(Math.max(1, userPage), totalPages);
  const startIndex = (currentPage - 1) * effectivePageSize;
  const endIndex = Math.min(startIndex + effectivePageSize, totalFiltered);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>
            Admin Panel
          </h1>
          <p className="page-sub">
            Live ops · Deposits · ROI 1% (2×) · Withdraw 10% · Refer L1/L2/L3 · Leader incentive
          </p>
        </div>
        <div className="admin-header-actions">
          <button className="btn btn-primary" type="button" onClick={giftAllMembers}>
            Gift All (manual)
          </button>
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
        <h3 style={{ marginTop: 0 }}>Pending Payments (Joining / Deposit)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.5rem' }}>User</th>
              <th style={{ padding: '0.5rem' }}>Type</th>
              <th style={{ padding: '0.5rem' }}>Amount</th>
              <th style={{ padding: '0.5rem' }}>Tx Hash</th>
              <th style={{ padding: '0.5rem' }}>Time</th>
              <th style={{ padding: '0.5rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {deposits.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                  No pending payments
                </td>
              </tr>
            )}
            {deposits.map((d) => (
              <tr key={d._id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '0.65rem' }}>{d.userId}</td>
                <td style={{ padding: '0.65rem' }}>{d.type === 'joining' ? 'Joining' : 'Deposit'}</td>
                <td style={{ padding: '0.65rem' }}>${Number(d.amount).toFixed(2)}</td>
                <td style={{ padding: '0.65rem', maxWidth: 160, wordBreak: 'break-all', fontSize: '0.8rem' }}>
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

      <CreateMemberAdminForm onDone={load} setMsg={setMsg} setErr={setErr} />

      <FundAdjustForm onDone={load} setMsg={setMsg} setErr={setErr} />

      <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>Automatic Daily ROI (1%)</h3>
        <p style={{ color: 'var(--text-muted)' }}>
          <strong>Auto:</strong> Vercel cron runs every day at 00:00 UTC — credits 1% ROI to all Joined members (cap
          2×). Level Income (ROI-ka-ROI) is disabled. <strong>Button:</strong> optional manual run if you need to credit
          today early / retry. Same day will not double-pay.
        </p>
        <button className="btn btn-success" type="button" onClick={runDailyRoi} disabled={roiRunning}>
          {roiRunning ? 'Running ROI…' : 'Run Daily ROI Now'}
        </button>
      </div>

      <form className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }} onSubmit={creditRoi}>
        <h3 style={{ marginTop: 0 }}>Manual ROI Credit (optional · 1%)</h3>
        <div className="form-grid-2">
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

      <div id="team-hierarchy-jump">
        <TeamHierarchy focusUserId={hierarchyFocus} />
      </div>

      <div id="user-history-jump" className="card" style={{ padding: '1.25rem', marginBottom: '1rem', overflowX: 'auto' }}>
        <h3 style={{ marginTop: 0 }}>User Deposit &amp; Credit History</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>
          Click <strong>History</strong> on any user row to load deposits, admin credits, ROI, and other transactions.
        </p>
        {historyLoading && <p style={{ color: 'var(--text-muted)' }}>Loading…</p>}
        {historyUser && (
          <p style={{ marginBottom: '0.75rem' }}>
            Showing: <strong>{historyUser.name}</strong> ({historyUser.userId}) · Joined:{' '}
            {historyUser.isJoined ? 'Yes' : 'No'} · Fund: ${Number(historyUser.fundBalance || 0).toFixed(2)} · Income: $
            {Number(historyUser.incomeBalance || 0).toFixed(2)}
          </p>
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.5rem' }}>Date</th>
              <th style={{ padding: '0.5rem' }}>Type</th>
              <th style={{ padding: '0.5rem' }}>Amount</th>
              <th style={{ padding: '0.5rem' }}>Status</th>
              <th style={{ padding: '0.5rem' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {!historyUser && (
              <tr>
                <td colSpan={5} style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                  No user selected yet
                </td>
              </tr>
            )}
            {historyUser && historyRows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                  No transactions for this user
                </td>
              </tr>
            )}
            {historyRows.map((h) => (
              <tr key={h._id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '0.65rem', whiteSpace: 'nowrap' }}>
                  {h.type === 'roi' && h.meta?.roiDay
                    ? `ROI day ${h.meta.roiDay}`
                    : new Date(h.createdAt).toLocaleString()}
                </td>
                <td style={{ padding: '0.65rem' }}>{h.type}</td>
                <td style={{ padding: '0.65rem' }}>${Number(h.amount || 0).toFixed(2)}</td>
                <td style={{ padding: '0.65rem' }}>{h.status}</td>
                <td style={{ padding: '0.65rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {h.description || '—'}
                  {h.meta?.txHash ? ` · Tx: ${h.meta.txHash}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem', overflowX: 'auto' }}>
        <h3 style={{ marginTop: 0 }}>Pending Withdrawals & Fund Refunds</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 0 }}>
          Fee is already deducted. Pay only the <strong>Net</strong> amount to the member wallet after review.
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.5rem' }}>User</th>
              <th style={{ padding: '0.5rem' }}>Type</th>
              <th style={{ padding: '0.5rem' }}>Requested</th>
              <th style={{ padding: '0.5rem' }}>Fee</th>
              <th style={{ padding: '0.5rem' }}>Net to pay</th>
              <th style={{ padding: '0.5rem' }}>Wallet</th>
              <th style={{ padding: '0.5rem' }}>Date</th>
              <th style={{ padding: '0.5rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                  No pending withdrawals
                </td>
              </tr>
            )}
            {withdrawals.map((w) => {
              const isRefund = w.kind === 'fund_refund';
              const requested = Number(w.requestedAmount ?? w.amount ?? 0);
              const fee = Number(w.fee || 0);
              const net = Number(w.amount || 0);
              const feePct =
                requested > 0 ? Number(((fee / requested) * 100).toFixed(0)) : isRefund ? 20 : 10;
              return (
                <tr key={w._id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.65rem' }}>{w.userId}</td>
                  <td style={{ padding: '0.65rem' }}>
                    <span style={{ color: isRefund ? '#fbbf24' : '#4ade80', fontWeight: 600 }}>
                      {isRefund ? 'Fund Refund' : 'Income'}
                    </span>
                  </td>
                  <td style={{ padding: '0.65rem' }}>${requested.toFixed(2)}</td>
                  <td style={{ padding: '0.65rem' }}>
                    ${fee.toFixed(2)}
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}> ({feePct}%)</span>
                    {isRefund && Number(w.roiDeducted || 0) > 0 && (
                      <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                        +${Number(w.roiDeducted).toFixed(2)} ROI clawback
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.65rem', fontWeight: 700 }}>${net.toFixed(2)}</td>
                  <td style={{ padding: '0.65rem', maxWidth: 160, wordBreak: 'break-all', fontSize: '0.8rem' }}>
                    {w.walletAddress}
                  </td>
                  <td style={{ padding: '0.65rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                    {w.createdAt ? new Date(w.createdAt).toLocaleString() : '—'}
                  </td>
                  <td style={{ padding: '0.65rem' }}>
                    <button className="btn btn-success" type="button" onClick={() => approve(w._id)}>
                      Mark Paid
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>Users (all details except password)</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.25rem 0 0' }}>
              Showing {totalFiltered === 0 ? 0 : startIndex + 1}–{endIndex} of {totalFiltered} members (Page {currentPage} of {totalPages}) · Total: {users.length} members
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Show:</span>
              <select
                className="input"
                style={{ width: 'auto', padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value));
                  setUserPage(1);
                }}
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
                <option value="all">Show All</option>
              </select>
            </div>
            <input
              className="input"
              style={{ width: '200px', padding: '0.4rem 0.75rem', fontSize: '0.9rem' }}
              placeholder="Search user, ID, mobile…"
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setUserPage(1);
              }}
            />
            <button
              className={`btn ${sortMode === 'business' ? 'btn-success' : 'btn-ghost'}`}
              type="button"
              style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}
              onClick={() => {
                setSortMode((m) => (m === 'business' ? 'newest' : 'business'));
                setUserPage(1);
              }}
            >
              {sortMode === 'business' ? '✓ Top Business' : 'Sort by Business'}
            </button>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.5rem' }}>ID</th>
              <th style={{ padding: '0.5rem' }}>Name</th>
              <th style={{ padding: '0.5rem' }}>Mobile</th>
              <th style={{ padding: '0.5rem' }}>Email</th>
              <th style={{ padding: '0.5rem' }}>Sponsor</th>
              <th style={{ padding: '0.5rem' }}>Wallet</th>
              <th style={{ padding: '0.5rem' }}>Joined</th>
              <th style={{ padding: '0.5rem' }}>Own Deposit</th>
              <th style={{ padding: '0.5rem', color: '#4ade80', fontWeight: 700 }}>Total Downline Business</th>
              <th style={{ padding: '0.5rem' }}>Direct Business</th>
              <th style={{ padding: '0.5rem' }}>Fund</th>
              <th style={{ padding: '0.5rem' }}>Income</th>
              <th style={{ padding: '0.5rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length === 0 && (
              <tr>
                <td colSpan={13} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No members found matching your search.
                </td>
              </tr>
            )}
            {paginatedUsers.map((u) => (
              <tr key={u.userId} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '0.65rem' }}>{u.userId}</td>
                <td style={{ padding: '0.65rem' }}>{u.name}</td>
                <td style={{ padding: '0.65rem' }}>{u.mobile || '—'}</td>
                <td style={{ padding: '0.65rem', fontSize: '0.85rem' }}>{u.email || '—'}</td>
                <td style={{ padding: '0.65rem' }}>{u.sponsorId || '—'}</td>
                <td style={{ padding: '0.65rem', maxWidth: 120, wordBreak: 'break-all', fontSize: '0.75rem' }}>
                  {u.walletAddress || '—'}
                </td>
                <td style={{ padding: '0.65rem' }}>{u.isJoined ? 'Yes' : 'No'}</td>
                <td style={{ padding: '0.65rem' }}>${Number(u.totalDeposited || 0).toFixed(2)}</td>
                <td style={{ padding: '0.65rem', fontWeight: 700, color: '#4ade80' }}>
                  ${Number(u.teamBusiness || 0).toFixed(2)}
                </td>
                <td style={{ padding: '0.65rem' }}>${Number(u.directBusiness || 0).toFixed(2)}</td>
                <td style={{ padding: '0.65rem' }}>${Number(u.fundBalance || 0).toFixed(2)}</td>
                <td style={{ padding: '0.65rem' }}>${Number(u.incomeBalance || 0).toFixed(2)}</td>
                <td style={{ padding: '0.65rem' }}>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-ghost" type="button" onClick={() => openHistory(u.userId)}>
                      History
                    </button>
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => {
                        setHierarchyFocus(u.userId);
                        document.getElementById('team-hierarchy-jump')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Tree
                    </button>
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => grantLeaderIncentive(u.userId)}
                      disabled={(u.leaderIncentiveAmount || 0) > 0}
                    >
                      {(u.leaderIncentiveAmount || 0) > 0 ? `Gift $${Number(u.leaderIncentiveAmount).toFixed(0)}` : 'No gift'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalFiltered > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1.25rem',
              flexWrap: 'wrap',
              gap: '0.75rem',
              borderTop: '1px solid var(--border)',
              paddingTop: '1rem',
            }}
          >
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Showing <strong>{startIndex + 1}</strong> – <strong>{endIndex}</strong> of <strong>{totalFiltered}</strong> members
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                className="btn btn-ghost"
                type="button"
                style={{ padding: '0.3rem 0.65rem', fontSize: '0.85rem' }}
                disabled={currentPage <= 1}
                onClick={() => setUserPage(1)}
              >
                « First
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                style={{ padding: '0.3rem 0.65rem', fontSize: '0.85rem' }}
                disabled={currentPage <= 1}
                onClick={() => setUserPage((p) => Math.max(1, p - 1))}
              >
                ‹ Prev
              </button>
              <span style={{ margin: '0 0.5rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Page <strong style={{ color: 'var(--text)' }}>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>
              <button
                className="btn btn-ghost"
                type="button"
                style={{ padding: '0.3rem 0.65rem', fontSize: '0.85rem' }}
                disabled={currentPage >= totalPages}
                onClick={() => setUserPage((p) => Math.min(totalPages, p + 1))}
              >
                Next ›
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                style={{ padding: '0.3rem 0.65rem', fontSize: '0.85rem' }}
                disabled={currentPage >= totalPages}
                onClick={() => setUserPage(totalPages)}
              >
                Last »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
