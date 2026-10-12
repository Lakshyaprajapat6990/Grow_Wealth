import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './NavratriGiftPopup.css';

const STORAGE_KEY = 'gw_navratri_gift_dismissed_v2_2026';

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

  const amount = Number(user.leaderIncentiveAmount || 100);
  const active = !!user.leaderIncentiveActive;
  const unlockAt = user.leaderIncentiveUnlockVolume || 500;

  return (
    <div className="navratri-overlay" role="dialog" aria-modal="true" aria-labelledby="navratri-title">
      <div className="navratri-modal">
        <button type="button" className="navratri-close" onClick={dismiss} aria-label="Close">
          ×
        </button>

        <div className="navratri-badge">Navratri Special</div>
        <div className="navratri-gift-icon" aria-hidden>
          🎁
        </div>
        <h2 id="navratri-title">Festive Gift for Every Member</h2>
        <p className="navratri-lead">
          Celebrate Navratri with Grow Wealth — every member receives a locked 100 USDT gift.
        </p>

        <ul className="navratri-points">
          <li>
            <strong>100 USDT</strong> gift — <strong>50</strong> from company + <strong>50</strong> from leader pool
          </li>
          <li>
            <strong>Locked</strong> — you cannot withdraw this amount
          </li>
          <li>
            <strong>ROI / trading</strong> unlocks when your downline Team Business reaches{' '}
            <strong>${unlockAt}</strong>
          </li>
        </ul>

        <div className={`navratri-status ${active ? 'on' : 'wait'}`}>
          {active
            ? `Your $${amount.toFixed(0)} gift trading is unlocked. Still non-withdrawable.`
            : `Your $${amount.toFixed(0)} gift is locked on your account. Build $${unlockAt} team business to unlock trading benefits.`}
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
