import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import './MemberLayout.css';

const menu = [
  {
    title: 'Main Menu',
    items: [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/system-live-feed', label: 'System Live Feed' },
      { to: '/trading', label: 'Live Trading' },
      { to: '/profile', label: 'My Profile' },
      { to: '/plan-details', label: 'Plan Details' },
      { to: '/my-account', label: 'My Account' },
    ],
  },
  {
    title: 'Network & History',
    items: [
      { to: '/deposit-history', label: 'Deposit History' },
      { to: '/direct-team', label: 'Direct Team' },
      { to: '/all-team', label: 'Level Team' },
    ],
  },
  {
    title: 'Income Reports',
    items: [
      { to: '/roi-income', label: 'ROI Income' },
      { to: '/direct-income', label: 'Direct Income' },
      { to: '/level-income', label: 'Level Income' },
      { to: '/salary-income', label: 'Monthly Salary' },
    ],
  },
  {
    title: 'Financials & Support',
    items: [
      { to: '/wallet-history', label: 'Wallet History' },
      { to: '/withdrawals', label: 'Withdrawals' },
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

  return (
    <div className="member-shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <span className="brand-mark" />
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
          <button className="btn btn-ghost menu-btn" onClick={() => setOpen((v) => !v)}>
            ☰ Menu
          </button>
          <div className="user-chip">
            <span>{user?.name}</span>
            <strong>{user?.userId}</strong>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
      {open && <div className="backdrop" onClick={() => setOpen(false)} />}
    </div>
  );
}
