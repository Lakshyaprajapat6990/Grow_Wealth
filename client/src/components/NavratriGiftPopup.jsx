import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './NavratriGiftPopup.css';

const STORAGE_KEY = 'gw_member_gift_dismissed_v3_10usdt';

export default function NavratriGiftPopup() {
  const { user, refreshUser } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || user.role === 'admin') return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') return;
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, [user]);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  if (!open || !user || user.role === 'admin') return null;

  const amount = Number(user.leaderIncentiveAmount || 10);
  const half = Number((amount / 2).toFixed(0));

  return (
    <div className="navratri-overlay" role="dialog" aria-modal="true" aria-labelledby="navratri-title">
      <div className="navratri-modal">
        <button type="button" className="navratri-close" onClick={dismiss} aria-label="Close">
          ×
        </button>

        <div className="navratri-badge">Welcome Gift</div>
        <div className="navratri-gift-icon" aria-hidden>
          🎁
        </div>
        <h2 id="navratri-title">Gift for Every Member</h2>
        <p className="navratri-lead">
          Welcome to Grow Wealth — every member receives a locked {amount.toFixed(0)} USDT gift.
        </p>

        <ul className="navratri-points">
          <li>
            <strong>{amount.toFixed(0)} USDT</strong> gift — <strong>{half}</strong> from company +{' '}
            <strong>{half}</strong> from leader pool
          </li>
          <li>
            <strong>Locked</strong> — you cannot withdraw this amount
          </li>
          <li>
            <strong>No ROI</strong> on this gift — daily ROI is only on your real deposits
          </li>
        </ul>

        <div className="navratri-status wait">
          Your ${amount.toFixed(0)} gift is on your Fund Balance. Non-withdrawable · no ROI on gift.
        </div>

        <button
          type="button"
          className="btn btn-primary navratri-cta"
          onClick={() => {
            if (refreshUser && user) refreshUser({ ...user, leaderIncentiveAmount: amount });
            dismiss();
          }}
        >
          Got it — Keep Growing
        </button>
      </div>
    </div>
  );
}
