import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import NavratriGiftPopup from '../components/NavratriGiftPopup';
import DiwaliWishPopup from '../components/DiwaliWishPopup';
import './MemberLayout.css';

const menu = [
  {
    title: 'Main Menu',
    items: [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/system-live-feed', label: 'System Live Feed' },
      { to: '/trading', label: 'Live Trading' },
      { to: '/profile', label: 'My Profile' },
      { to: '/change-password', label: 'Change Password' },
      { to: '/my-account', label: 'My Account' },
    ],
  },
  {
    title: 'Network & History',
    items: [
      { to: '/deposit-history', label: 'Deposit History' },
      { to: '/direct-team', label: 'Direct Team' },
      { to: '/all-team', label: 'All Team' },
    ],
  },
  {
    title: 'Income Reports',
    items: [
      { to: '/roi-income', label: 'ROI Income' },
      { to: '/direct-income', label: 'Refer & Earn' },
      { to: '/salary-income', label: 'Monthly Salary' },
      { to: '/rank-rewards', label: 'Rank & Rewards' },
    ],
  },
  {
    title: 'Financials & Support',
    items: [
      { to: '/wallet-history', label: 'Wallet History' },
      { to: '/withdrawals', label: 'Withdrawals' },
      { to: '/refund-fund', label: 'Refund Fund' },
      { to: '/compound', label: 'Manual Compound' },
      { to: '/transfer', label: 'Fund Transfer' },
      { to: '/support', label: 'Support Ticket' },
      { to: '/notifications', label: 'Notifications' },
    ],
  },
];

export default function MemberLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get('/notifications/me').then((r) => setUnread(r.data.unread || 0)).catch(() => {});
  }, []);

  useEffect(() => {
    document.body.classList.toggle('menu-locked', open);
    return () => document.body.classList.remove('menu-locked');
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="member-shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <img className="brand-logo" src="/logo.png" alt="Grow Wealth" width="44" height="44" />
          <div>
            <strong>GROW WEALTH</strong>
            <small>Member Panel</small>
          </div>
        </div>

        <div className="sidebar-scroll">
          {menu.map((section) => (
            <div key={section.title} className="menu-section">
              <h3>{section.title}</h3>
              {section.items.map((item) => (
                <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)}>
                  {item.label}
                  {item.to === '/notifications' && unread > 0 && (
                    <span className="nav-badge">{unread}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
          {isAdmin && (
            <div className="menu-section">
              <h3>Admin</h3>
              <NavLink to="/admin" onClick={() => setOpen(false)}>
                Admin Panel
              </NavLink>
            </div>
          )}
        </div>

        <a
          href="/GrowWealth.apk"
          download="GrowWealth.apk"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.75rem 1rem',
            margin: '0.5rem 0.75rem 0.75rem',
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.18), rgba(16, 185, 129, 0.08))',
            border: '1px solid rgba(34, 197, 94, 0.35)',
            borderRadius: '10px',
            color: '#4ade80',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.88rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          }}
          title="Download Grow Wealth Android App (v1.2.1)"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0003 0-.5517.4482-1.0003.9993-1.0003.5517 0 .9993.4486.9993 1.0003 0 .5517-.4476 1.0003-.9993 1.0003m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0003 0-.5517.4482-1.0003.9993-1.0003.5517 0 .9993.4486.9993 1.0003 0 .5517-.4476 1.0003-.9993 1.0003m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4116 13.8533 8 12 8s-3.5902.4116-5.1368.9507L4.841 5.4478a.416.416 0 00-.5676-.1521.416.416 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396"/>
          </svg>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 700 }}>Android App</div>
            <div style={{ fontSize: '0.72rem', color: '#4ade80' }}>Download APK (v1.2.1)</div>
          </div>
        </a>

        <button
          className="btn logout-btn"
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          Logout Account
        </button>
      </aside>

      <div className="member-main">
        <header className="topbar">
          <button
            className="btn btn-ghost menu-btn"
            onClick={() => setOpen((v) => !v)}
            aria-label="Open menu"
            aria-expanded={open}
          >
            ☰ Menu
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <a
              href="/GrowWealth.apk"
              download="GrowWealth.apk"
              className="btn btn-ghost topbar-app-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.65rem',
                fontSize: '0.82rem',
                color: '#4ade80',
                borderColor: 'rgba(34, 197, 94, 0.35)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
              title="Download Grow Wealth Android App (APK)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0003 0-.5517.4482-1.0003.9993-1.0003.5517 0 .9993.4486.9993 1.0003 0 .5517-.4476 1.0003-.9993 1.0003m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0003 0-.5517.4482-1.0003.9993-1.0003.5517 0 .9993.4486.9993 1.0003 0 .5517-.4476 1.0003-.9993 1.0003m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4116 13.8533 8 12 8s-3.5902.4116-5.1368.9507L4.841 5.4478a.416.416 0 00-.5676-.1521.416.416 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396"/>
              </svg>
              <span>Download App</span>
            </a>
            <div className="user-chip">
              <span>{user?.name}</span>
              <strong>{user?.userId}</strong>
            </div>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
      {open && <div className="backdrop" onClick={() => setOpen(false)} />}
      <DiwaliWishPopup />
      <NavratriGiftPopup />
    </div>
  );
}
