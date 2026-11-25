import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import { referralLink } from '../constants/site';

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [showSalaryModal, setShowSalaryModal] = useState(false);

  useEffect(() => {
    api
      .get('/user/dashboard/summary')
      .then((r) => {
        setSummary(r.data);
        const sum = r.data?.summary;
        if (sum?.salaryPopupEligible && !sum?.salaryPopupDismissed) {
          const dismissed = sessionStorage.getItem(`gw_sal_popup_${user?.userId}`);
          if (!dismissed) {
            setShowSalaryModal(true);
          }
        }
      })
      .catch(() => {});
  }, [user?.userId]);

  function handleDismissSalaryPopup() {
    setShowSalaryModal(false);
    try {
      sessionStorage.setItem(`gw_sal_popup_${user?.userId}`, '1');
    } catch {
      /* ignore */
    }
    api.post('/user/salary-popup/dismiss').catch(() => {});
  }

  const s = summary?.summary || user || {};
  const rankPlan = summary?.rankPlan || [];
  const refLink = referralLink(user?.userId);
  const teamBusiness = Number(s.teamBusiness || 0);
  const directBusiness = Number(s.directBusiness || 0);
  const next = s.nextRank;
  const nextProgress =
    next && next.target > 0 ? Math.min(100, Number(((teamBusiness / next.target) * 100).toFixed(1))) : 100;

  const giftAmt = Number(s.leaderIncentiveAmount ?? user?.leaderIncentiveAmount ?? 0);
  const stats = [
    {
      label: 'Fund Balance',
      value: `$${(s.fundBalance || 0).toFixed(2)}`,
      cls: '',
      hint: giftAmt > 0 ? `Includes $${giftAmt.toFixed(0)} locked gift` : '',
    },
    { label: 'Income Balance', value: `$${(s.incomeBalance || 0).toFixed(2)}`, cls: 'green' },
    { label: 'Team Business', value: `$${teamBusiness.toFixed(2)}`, cls: 'gold' },
    {
      label: 'Direct Business',
      value: `$${directBusiness.toFixed(2)}`,
      cls: directBusiness >= 500 ? 'green' : 'gold',
      hint: directBusiness >= 500 ? '✓ Salary Unlocked' : 'Min $500 for Salary',
    },
    { label: 'Current Rank', value: s.currentRank || 0, cls: '' },
    { label: 'Total Deposited', value: `$${(s.totalDeposited || 0).toFixed(2)}`, cls: '' },
    { label: 'Total ROI', value: `$${(s.totalRoiIncome || 0).toFixed(2)}`, cls: 'gold' },
    { label: 'Refer & Earn', value: `$${(s.totalDirectIncome || 0).toFixed(2)}`, cls: '' },
    { label: 'Rank Rewards Paid', value: `$${(s.totalRankReward || 0).toFixed(2)}`, cls: 'gold' },
    { label: 'Direct Team', value: s.directCount || 0, cls: '' },
  ];

  const quick = [
    { to: '/deposit', icon: '💰', label: 'Deposit' },
    { to: '/withdrawals', icon: '💸', label: 'Withdraw' },
    { to: '/compound', icon: '♻️', label: 'Compound' },
    { to: '/transfer', icon: '🔄', label: 'Transfer' },
    { to: '/direct-team', icon: '👥', label: 'My Team' },
    { to: '/rank-rewards', icon: '🏆', label: 'Rank Rewards' },
    { to: '/roi-income', icon: '📈', label: 'ROI Income' },
    { to: '/support', icon: '🎫', label: 'Support' },
    { to: '/system-live-feed', icon: '📡', label: 'Live Feed' },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome, ${user?.name} · Status: ${user?.isJoined ? 'Joined' : 'Not Joined — deposit to activate'}`}
      />

      {!user?.isJoined && (
        <div
          className="card"
          style={{
            padding: '1.25rem',
            marginBottom: '1rem',
            borderColor: 'rgba(247,192,43,0.45)',
            background: 'rgba(247,192,43,0.08)',
          }}
        >
          <h3 style={{ marginTop: 0, color: 'var(--accent)' }}>Deposit to Activate</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>
            Deposit USDT (BEP-20). Joining activates automatically after your deposit is credited.
          </p>
          <Link className="btn btn-success" to="/deposit">
            Deposit USDT
          </Link>
        </div>
      )}

      <div className="dash-grid">
        {stats.map((st) => (
          <div className={`card dash-card ${st.cls}`} key={st.label}>
            <div className="label">{st.label}</div>
            <div className="value">{st.value}</div>
            {st.hint ? (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{st.hint}</div>
            ) : null}
          </div>
        ))}
      </div>

      {/* Team Business + Rank progress */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          marginBottom: '1rem',
          borderColor: 'rgba(247,192,43,0.35)',
          background: 'linear-gradient(160deg, rgba(22,30,46,0.98), rgba(10,13,20,0.96))',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--accent)' }}>My Team Business</h3>
            <p style={{ margin: '0.4rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Total deposits from your full downline (your own deposit is not counted). Team size does not matter.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Team Business
            </div>
            <div style={{ fontFamily: 'var(--display)', fontSize: '1.7rem', fontWeight: 800, color: 'var(--accent)' }}>
              ${teamBusiness.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Team members: {s.teamSize || 0} · Rank: {s.currentRank || 0}
            </div>
          </div>
        </div>

        {next ? (
          <div style={{ marginTop: '1.1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
              <strong style={{ color: 'var(--text)' }}>
                Next reward: Rank {next.rank} (${Number(next.target).toLocaleString()} Team + ${Number(next.directTarget || 0).toLocaleString()} Direct)
              </strong>
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{next.reward} USDT</span>
            </div>
            <p style={{ margin: '0.35rem 0 0.65rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Need ${Number(s.remainingToNextRank ?? (next.target - teamBusiness)).toFixed(2)} team business & ${Math.max(0, (next.directTarget || 0) - directBusiness).toFixed(2)} direct business.
            </p>
            <div
              style={{
                height: 10,
                borderRadius: 999,
                background: 'rgba(42,51,71,0.95)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${nextProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #b6d92a, #d4f84a)',
                  borderRadius: 999,
                }}
              />
            </div>
            <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Team: {nextProgress}% (${teamBusiness.toLocaleString()} / ${Number(next.target).toLocaleString()}) &bull; Direct: {next.directTarget ? Math.min(100, Number(((directBusiness / next.directTarget) * 100).toFixed(1))) : 100}% (${directBusiness.toLocaleString()} / ${Number(next.directTarget || 0).toLocaleString()})
            </div>
          </div>
        ) : (
          <p style={{ margin: '1rem 0 0', color: '#4ade80' }}>
            Top rank complete. Total rank rewards paid: ${(s.totalRankReward || 0).toFixed(2)} USDT
          </p>
        )}

        <div style={{ marginTop: '1rem' }}>
          <Link className="btn btn-primary" to="/rank-rewards">
            Open Rank & Rewards
          </Link>
        </div>
      </div>

      {/* Reward guide table */}
      <div className="card" style={{ padding: 0, marginBottom: '1rem', overflowX: 'auto' }}>
        <div style={{ padding: '1rem 1.25rem 0.5rem' }}>
          <h3 style={{ margin: 0, color: 'var(--accent)' }}>Rank Rewards Guide</h3>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Dual qualification: Achieve Team Business + Direct Referral Business (13%) to claim each one-time USDT reward.
          </p>
        </div>
        <table className="mp-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team Target</th>
              <th>Direct Target (13%)</th>
              <th>Your Reward</th>
              <th>Your Status</th>
            </tr>
          </thead>
          <tbody>
            {(s.ranks && s.ranks.length ? s.ranks : rankPlan).map((r) => {
              const teamHit = r.teamHit ?? (teamBusiness >= r.target);
              const directHit = r.directHit ?? (directBusiness >= (r.directTarget || 0));
              const paid = r.paid ?? ((s.ranksClaimed || []).includes?.(r.rank) && directHit);
              const unlocked = r.unlocked ?? (teamHit && directHit);
              const pendingDirect = r.pendingDirect ?? (teamHit && !directHit);
              const statusText = paid
                ? 'Paid'
                : unlocked
                ? 'Ready'
                : pendingDirect
                ? `Need $${Math.max(0, (r.directTarget || 0) - directBusiness).toLocaleString()} Direct`
                : 'Locked';
              const statusColor = paid ? '#4ade80' : unlocked ? '#4ade80' : pendingDirect ? '#fbbf24' : 'var(--text-muted)';
              return (
                <tr key={r.rank}>
                  <td>Rank {r.rank}{r.rank === 10 ? ' (Top)' : ''}</td>
                  <td>${Number(r.target).toLocaleString()}</td>
                  <td style={{ color: 'var(--accent)' }}>${Number(r.directTarget || 0).toLocaleString()}</td>
                  <td style={{ color: '#4ade80', fontWeight: 700 }}>{r.reward} USDT</td>
                  <td style={{ color: statusColor, fontWeight: 600 }}>
                    {statusText}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ padding: '0.75rem 1.25rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          Example: Rank 1 unlocks 150 USDT when team hits $5,000 and direct business hits $650.
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <h3 style={{ marginTop: 0, color: 'var(--accent)' }}>Your Team Referral Link</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>
          Share this link — new members register under your ID as sponsor.
        </p>
        <code style={{ color: 'var(--accent)', wordBreak: 'break-all', fontSize: '0.88rem' }}>{refLink}</code>
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" type="button" onClick={() => navigator.clipboard.writeText(refLink)}>
            Copy Team Link
          </button>
          <Link className="btn btn-primary" to="/direct-team">
            View Direct Team
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ marginTop: 0, color: 'var(--accent)' }}>Quick Actions</h3>
        <div className="quick-grid">
          {quick.map((q) => (
            <Link key={q.to} to={q.to} className="quick-btn">
              <span>{q.icon}</span>
              <span>{q.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Salary Unlocked Milestone Pop-Up Modal */}
      {showSalaryModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 9, 18, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1.25rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              background: 'linear-gradient(145deg, #182234, #0b101b)',
              border: '2px solid #f7c02b',
              borderRadius: '20px',
              boxShadow: '0 25px 60px -10px rgba(247, 192, 43, 0.45)',
              padding: '2.25rem 1.75rem',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                fontSize: '3.6rem',
                lineHeight: 1,
                marginBottom: '0.75rem',
                filter: 'drop-shadow(0 0 18px rgba(247,192,43,0.55))',
              }}
            >
              🎉 🏆
            </div>
            <h2
              style={{
                color: '#f7c02b',
                margin: '0 0 0.4rem',
                fontSize: '1.75rem',
                fontFamily: 'var(--display)',
                fontWeight: 800,
              }}
            >
              Congratulations!
            </h2>
            <h4
              style={{
                color: '#ffffff',
                margin: '0 0 1rem',
                fontSize: '1.15rem',
                fontWeight: 600,
              }}
            >
              Daily Salary & Withdrawals Unlocked!
            </h4>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.5, margin: '0 0 1.25rem' }}>
              You have completed both required milestones:
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1.25rem',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(74, 222, 128, 0.35)',
                  borderRadius: '12px',
                  padding: '0.85rem',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 800, textTransform: 'uppercase' }}>
                  ✓ Completed
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', marginTop: '0.2rem' }}>
                  ${teamBusiness.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Downline Team Business (Min $3,000)
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(74, 222, 128, 0.35)',
                  borderRadius: '12px',
                  padding: '0.85rem',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 800, textTransform: 'uppercase' }}>
                  ✓ Completed
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', marginTop: '0.2rem' }}>
                  ${directBusiness.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Direct Refer Link (Min $500)
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'linear-gradient(90deg, rgba(247,192,43,0.15), rgba(74,222,128,0.15))',
                border: '1px solid rgba(247,192,43,0.35)',
                borderRadius: '12px',
                padding: '0.9rem',
                marginBottom: '1.5rem',
                color: '#fff',
                fontSize: '0.92rem',
                lineHeight: 1.6,
              }}
            >
              🌟 <strong>Tier 1 Daily Salary:</strong>{' '}
              <span style={{ color: '#4ade80', fontWeight: 800 }}>$6.00 USDT / day</span> ($180 / month)
              <br />
              ⚡ <strong>Daily Withdrawals:</strong>{' '}
              <span style={{ color: '#4ade80', fontWeight: 800 }}>Unlocked & Active</span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                to="/salary-income"
                className="btn btn-primary"
                style={{ padding: '0.65rem 1.4rem', fontWeight: 700 }}
                onClick={handleDismissSalaryPopup}
              >
                View Salary Income →
              </Link>
              <button
                className="btn btn-ghost"
                type="button"
                style={{ padding: '0.65rem 1.25rem' }}
                onClick={handleDismissSalaryPopup}
              >
                Great, Continue!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
