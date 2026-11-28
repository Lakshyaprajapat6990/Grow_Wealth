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
  const [showPendingDirectModal, setShowPendingDirectModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    api
      .get('/user/dashboard/summary')
      .then((r) => {
        setSummary(r.data);
        const sum = r.data?.summary;
        const teamB = Number(sum?.teamBusiness || 0);
        const directB = Number(sum?.directBusiness || 0);

        if (sum?.salaryPopupEligible) {
          const dismissed = sessionStorage.getItem(`gw_sal_popup_${user?.userId}`);
          if (!dismissed) {
            setShowSalaryModal(true);
            return;
          }
        }

        // 2-Task Milestone check: Task 1 (Team Business >= $3000) completed, but Task 2 (Direct Business) pending
        if (teamB >= 3000 && (directB < 500 || (teamB >= 5000 && directB < 650))) {
          const taskDismissed = sessionStorage.getItem(`gw_task_milestone_${user?.userId}`);
          if (!taskDismissed) {
            setShowPendingDirectModal(true);
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

  function handleDismissPendingDirectModal() {
    setShowPendingDirectModal(false);
    try {
      sessionStorage.setItem(`gw_task_milestone_${user?.userId}`, '1');
    } catch {
      /* ignore */
    }
  }

  function handleCopyReferralLink() {
    navigator.clipboard.writeText(refLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
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

      {/* Quick Access Certificate Banner for Qualified Leaders */}
      {s?.salaryPopupEligible && (
        <div
          className="card"
          style={{
            background: 'linear-gradient(90deg, rgba(247,192,43,0.18), rgba(74,222,128,0.12))',
            border: '1px solid rgba(247,192,43,0.45)',
            borderRadius: '14px',
            padding: '0.85rem 1.25rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <img
              src="/logo.png"
              alt="Grow Wealth"
              width="38"
              height="38"
              style={{ filter: 'drop-shadow(0 0 8px rgba(247,192,43,0.6))', display: 'block' }}
            />
            <div>
              <div style={{ color: '#f7c02b', fontWeight: 800, fontSize: '0.98rem' }}>
                🎉 Daily Salary Milestone Achieved!
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>
                Tier 1 Daily Salary: <strong>$6.00 USDT/day</strong> &bull; <strong>Daily Withdrawals Active</strong>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: '0.5rem 1.15rem', fontSize: '0.84rem', fontWeight: 700 }}
            onClick={() => setShowSalaryModal(true)}
          >
            🎖️ View Certificate of Achievement
          </button>
        </div>
      )}

      {/* Milestone Progress Banner for Members with Team >= $3000 Pending Direct */}
      {!s?.salaryPopupEligible && teamBusiness >= 3000 && (directBusiness < 500 || (teamBusiness >= 5000 && directBusiness < 650)) && (
        <div
          className="card"
          style={{
            background: 'rgba(247,192,43,0.08)',
            border: '1px solid rgba(247,192,43,0.4)',
            borderRadius: '14px',
            padding: '0.85rem 1.25rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: '0.96rem' }}>
              🎯 Milestone 1 Done (${teamBusiness.toFixed(2)} Team Business) — Complete Milestone 2!
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
              Need ${Math.max(0, 500 - directBusiness).toFixed(2)} more in direct referral business to unlock daily salary.
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: '0.5rem 1.1rem', fontSize: '0.84rem', borderColor: 'rgba(247,192,43,0.5)', color: '#f7c02b' }}
            onClick={() => setShowPendingDirectModal(true)}
          >
            View Milestone Progress
          </button>
        </div>
      )}

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

      {/* Salary Unlocked Certificate of Achievement Modal */}
      {showSalaryModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 9, 18, 0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '620px',
              width: '100%',
              background: 'radial-gradient(ellipse at top, #162544 0%, #0a1120 70%, #050a14 100%)',
              border: '2px solid #f7c02b',
              borderRadius: '24px',
              boxShadow: '0 30px 80px -10px rgba(247, 192, 43, 0.45), inset 0 0 0 2px rgba(247, 192, 43, 0.3)',
              padding: '2.4rem 1.85rem',
              textAlign: 'center',
              position: 'relative',
              maxHeight: '94vh',
              overflowY: 'auto',
            }}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={handleDismissSalaryPopup}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#aaa',
                borderRadius: '50%',
                width: 32,
                height: 32,
                cursor: 'pointer',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>

            {/* Top Center: Official Grow Wealth Logo */}
            <div style={{ textAlign: 'center', marginBottom: '0.85rem' }}>
              <div
                style={{
                  display: 'inline-block',
                  padding: '6px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(247, 192, 43, 0.25) 0%, rgba(247, 192, 43, 0.02) 70%)',
                  boxShadow: '0 0 25px rgba(247, 192, 43, 0.45)',
                }}
              >
                <img
                  src="/logo.png"
                  alt="Grow Wealth"
                  style={{
                    width: 76,
                    height: 76,
                    objectFit: 'contain',
                    display: 'block',
                    margin: '0 auto',
                    filter: 'drop-shadow(0 0 10px rgba(247,192,43,0.65))',
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: '0.74rem',
                  color: '#f7c02b',
                  letterSpacing: '0.22em',
                  fontWeight: 800,
                  marginTop: '0.5rem',
                  textTransform: 'uppercase',
                }}
              >
                Grow Wealth Global
              </div>
            </div>

            {/* Certificate Header */}
            <div
              style={{
                fontSize: '0.82rem',
                color: '#e2e8f0',
                letterSpacing: '0.25em',
                fontWeight: 600,
                textTransform: 'uppercase',
                marginBottom: '0.2rem',
              }}
            >
              Official Recognition
            </div>
            <h2
              style={{
                color: '#f7c02b',
                margin: '0 0 0.5rem',
                fontSize: '1.9rem',
                fontFamily: "'Georgia', 'Times New Roman', serif",
                letterSpacing: '0.08em',
                fontWeight: 900,
                textTransform: 'uppercase',
                textShadow: '0 0 20px rgba(247, 192, 43, 0.5)',
              }}
            >
              Certificate of Achievement
            </h2>

            <div
              style={{
                fontSize: '0.92rem',
                fontStyle: 'italic',
                color: '#cbd5e1',
                marginBottom: '0.35rem',
                fontFamily: "'Georgia', serif",
              }}
            >
              Proudly Presented to :
            </div>

            <div
              style={{
                fontSize: '1.65rem',
                fontWeight: 800,
                color: '#ffffff',
                fontFamily: "'Georgia', serif",
                textShadow: '0 0 14px rgba(247, 192, 43, 0.45)',
                marginBottom: '0.2rem',
              }}
            >
              {user?.name || 'Valued Member'}
            </div>
            <div
              style={{
                fontSize: '0.85rem',
                color: '#f7c02b',
                fontWeight: 700,
                letterSpacing: '0.05em',
                marginBottom: '1rem',
              }}
            >
              User ID: {user?.userId}
            </div>

            <p
              style={{
                color: '#cbd5e1',
                fontSize: '0.88rem',
                lineHeight: 1.55,
                margin: '0 auto 1.35rem',
                maxWidth: 480,
              }}
            >
              In recognition of your outstanding leadership, dedication, and dedication in successfully completing
              both milestones to unlock the <strong>Grow Wealth Daily Salary Program</strong> and <strong>Daily Withdrawals</strong>.
            </p>

            {/* Milestone Verification Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1.25rem',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  background: 'rgba(74, 222, 128, 0.08)',
                  border: '1px solid rgba(74, 222, 128, 0.45)',
                  borderRadius: '12px',
                  padding: '0.85rem 1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: '#4ade80', fontWeight: 800, textTransform: 'uppercase' }}>
                    ✓ Milestone 1
                  </span>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', padding: '0.1rem 0.45rem', borderRadius: 999, fontWeight: 700 }}>
                    COMPLETED
                  </span>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff', marginTop: '0.25rem' }}>
                  ${teamBusiness.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                </div>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                  Downline Team Business (Min $3,000)
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(74, 222, 128, 0.08)',
                  border: '1px solid rgba(74, 222, 128, 0.45)',
                  borderRadius: '12px',
                  padding: '0.85rem 1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: '#4ade80', fontWeight: 800, textTransform: 'uppercase' }}>
                    ✓ Milestone 2
                  </span>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', padding: '0.1rem 0.45rem', borderRadius: 999, fontWeight: 700 }}>
                    COMPLETED
                  </span>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff', marginTop: '0.25rem' }}>
                  ${directBusiness.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                </div>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                  Direct Referral Business (Min $500)
                </div>
              </div>
            </div>

            {/* Salary Benefit Box */}
            <div
              style={{
                background: 'linear-gradient(90deg, rgba(247,192,43,0.16), rgba(74,222,128,0.16))',
                border: '1px solid rgba(247,192,43,0.45)',
                borderRadius: '14px',
                padding: '0.95rem 1.1rem',
                marginBottom: '1.35rem',
                textAlign: 'left',
              }}
            >
              <div style={{ color: '#f7c02b', fontWeight: 800, fontSize: '0.86rem', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                🌟 Privileges & Salary Unlocked:
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', color: '#fff', fontSize: '0.94rem' }}>
                <div>
                  💰 <strong>Daily Salary:</strong> <span style={{ color: '#4ade80', fontWeight: 800 }}>$6.00 USDT / day</span> ($180 / mo)
                </div>
                <div>
                  ⚡ <strong>Daily Withdrawals:</strong> <span style={{ color: '#4ade80', fontWeight: 800 }}>Active 24/7</span>
                </div>
              </div>
            </div>

            {/* Certification Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid rgba(247, 192, 43, 0.25)',
                paddingTop: '0.85rem',
                marginBottom: '1.35rem',
                fontSize: '0.78rem',
                color: '#94a3b8',
                textAlign: 'left',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div>
                <span style={{ color: '#f7c02b', fontWeight: 700 }}>Certified By:</span> Grow Wealth Global Management
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#4ade80', fontWeight: 700 }}>BEP-20 Verified</span> &bull; Smart Contract Active
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`🏆 *CERTIFICATE OF ACHIEVEMENT — GROW WEALTH* 🏆\n\nI have officially unlocked the *Daily Salary Program* ($6.00 USDT/day = $180/Month) and *Daily Withdrawals* at Grow Wealth!\n\n👥 Downline Team: $${teamBusiness.toFixed(2)} USDT\n🎯 Direct Business: $${directBusiness.toFixed(2)} USDT\n\nJoin my winning team: ${refLink}`)}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ padding: '0.65rem 1.35rem', fontWeight: 700 }}
              >
                Share on WhatsApp 🚀
              </a>
              <Link
                to="/salary-income"
                className="btn btn-success"
                style={{ padding: '0.65rem 1.35rem', fontWeight: 700 }}
                onClick={handleDismissSalaryPopup}
              >
                View Salary Income →
              </Link>
              <button
                className="btn btn-ghost"
                type="button"
                style={{ padding: '0.65rem 1.15rem' }}
                onClick={handleDismissSalaryPopup}
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2-Task Milestone Modal: Task 1 Completed, Task 2 (Direct Referral Business) Pending */}
      {showPendingDirectModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(5, 9, 17, 0.88)',
            backdropFilter: 'blur(10px)',
            padding: '1rem',
          }}
        >
          <div
            style={{
              maxWidth: 560,
              width: '100%',
              background: 'linear-gradient(155deg, #151f32 0%, #0c1322 100%)',
              border: '2px solid rgba(247, 192, 43, 0.65)',
              borderRadius: '20px',
              boxShadow: '0 25px 60px -10px rgba(247, 192, 43, 0.35)',
              padding: '2rem 1.6rem',
              textAlign: 'center',
              position: 'relative',
              maxHeight: '92vh',
              overflowY: 'auto',
            }}
          >
            <button
              type="button"
              onClick={handleDismissPendingDirectModal}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#aaa',
                borderRadius: '50%',
                width: 32,
                height: 32,
                cursor: 'pointer',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>

            <div
              style={{
                fontSize: '3.2rem',
                lineHeight: 1,
                marginBottom: '0.65rem',
                filter: 'drop-shadow(0 0 16px rgba(247,192,43,0.5))',
              }}
            >
              🎯 🏆
            </div>

            <h2
              style={{
                color: '#f7c02b',
                margin: '0 0 0.35rem',
                fontSize: '1.65rem',
                fontFamily: 'var(--display)',
                fontWeight: 800,
              }}
            >
              Task 1 Completed!
            </h2>
            <h4
              style={{
                color: '#ffffff',
                margin: '0 0 1rem',
                fontSize: '1.08rem',
                fontWeight: 600,
              }}
            >
              Now Complete Task 2 to Unlock Rank Reward & Daily Salary
            </h4>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 1.25rem' }}>
              Congratulations on building your team business! You have completed the first milestone. Complete the second task below to unlock your bonuses:
            </p>

            {/* 2 Tasks Visualizer */}
            <div style={{ display: 'grid', gap: '0.85rem', marginBottom: '1.25rem', textAlign: 'left' }}>
              {/* Task 1 */}
              <div
                style={{
                  background: 'rgba(74, 222, 128, 0.06)',
                  border: '1px solid rgba(74, 222, 128, 0.45)',
                  borderRadius: '12px',
                  padding: '0.9rem 1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.78rem', color: '#4ade80', fontWeight: 800, textTransform: 'uppercase' }}>
                    ✓ Task 1: Downline Team Business
                  </span>
                  <span style={{ fontSize: '0.78rem', background: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', padding: '0.15rem 0.5rem', borderRadius: 999, fontWeight: 700 }}>
                    COMPLETED
                  </span>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff', marginTop: '0.35rem' }}>
                  ${teamBusiness.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Target Met: Min $3,000 for Daily Salary &bull; Min $5,000 for Rank 1
                </div>
              </div>

              {/* Task 2 */}
              <div
                style={{
                  background: 'rgba(247, 192, 43, 0.08)',
                  border: '1px solid rgba(247, 192, 43, 0.55)',
                  borderRadius: '12px',
                  padding: '0.9rem 1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase' }}>
                    ⏳ Task 2: Personal Direct Referral Business
                  </span>
                  <span style={{ fontSize: '0.78rem', background: 'rgba(247, 192, 43, 0.2)', color: '#fbbf24', padding: '0.15rem 0.5rem', borderRadius: 999, fontWeight: 700 }}>
                    IN PROGRESS
                  </span>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fbbf24', marginTop: '0.35rem' }}>
                  ${directBusiness.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                </div>
                <div style={{ fontSize: '0.84rem', color: '#e2e8f0', marginTop: '0.35rem', lineHeight: 1.45 }}>
                  {directBusiness < 500 && (
                    <div>• Daily Salary: Need <strong>${Math.max(0, 500 - directBusiness).toFixed(2)}</strong> more direct business (Target: $500)</div>
                  )}
                  {directBusiness < 650 && (
                    <div>• Rank 1 (150 USDT): Need <strong>${Math.max(0, 650 - directBusiness).toFixed(2)}</strong> more direct business (Target: $650)</div>
                  )}
                </div>
              </div>
            </div>

            {/* Unlocks Upon Completion */}
            <div
              style={{
                background: 'linear-gradient(90deg, rgba(247,192,43,0.12), rgba(74,222,128,0.12))',
                border: '1px solid rgba(247,192,43,0.3)',
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
                textAlign: 'left',
                fontSize: '0.86rem',
                lineHeight: 1.6,
                color: '#e2e8f0',
              }}
            >
              <div style={{ color: '#f7c02b', fontWeight: 700, marginBottom: '0.25rem' }}>
                🎁 Complete Task 2 to immediately unlock:
              </div>
              <div>💰 <strong>150 USDT Rank 1 Reward</strong> credited directly to Income Balance</div>
              <div>📅 <strong>Daily Salary Income</strong> ($6.00/day = $180/month)</div>
              <div>⚡ <strong>Daily Withdrawals</strong> unlocked on your earnings</div>
            </div>

            {/* Referral Link Quick Sharing */}
            <div style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Share your personal referral link with new members:
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8,
                  padding: '0.45rem 0.65rem',
                  gap: '0.5rem',
                }}
              >
                <code style={{ flex: 1, fontSize: '0.8rem', color: '#fbbf24', wordBreak: 'break-all' }}>
                  {refLink}
                </code>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                  onClick={handleCopyReferralLink}
                >
                  {copiedLink ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Join Grow Wealth with my link: ${refLink}`)}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ padding: '0.65rem 1.25rem', fontWeight: 700 }}
              >
                Share on WhatsApp 🚀
              </a>
              <button
                className="btn btn-ghost"
                type="button"
                style={{ padding: '0.65rem 1.25rem' }}
                onClick={handleDismissPendingDirectModal}
              >
                Got it, I&apos;ll Complete Task 2!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
