import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './NavratriGiftPopup.css';

const STORAGE_KEY = 'gw_navratri_gift_dismissed_2026';

export default function NavratriGiftPopup() {
  const { user } = useAuth();
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

  const hasIncentive = Number(user.leaderIncentiveAmount || 0) > 0;
  const active = !!user.leaderIncentiveActive;

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
        <h2 id="navratri-title">Festive Leader Gift</h2>
        <p className="navratri-lead">
          Celebrate Navratri with Grow Wealth — a locked gift for selected leaders to grow faster.
        </p>

        <ul className="navratri-points">
          <li>
            <strong>100 USDT</strong> gift — <strong>50</strong> from company + <strong>50</strong> from leader
          </li>
          <li>
            <strong>Locked</strong> — not withdrawable
          </li>
          <li>
            <strong>ROI / trading</strong> unlocks when your downline business reaches <strong>$500</strong>
          </li>
        </ul>

        {hasIncentive ? (
          <div className={`navratri-status ${active ? 'on' : 'wait'}`}>
            {active
              ? `Your $${Number(user.leaderIncentiveAmount).toFixed(0)} gift trading is unlocked. Still non-withdrawable.`
              : `You have $${Number(user.leaderIncentiveAmount).toFixed(0)} locked. Build $${user.leaderIncentiveUnlockVolume || 500} team business to unlock trading benefits.`}
          </div>
        ) : (
          <div className="navratri-status wait">
            Selected leaders receive this gift from Admin (Leader +100). Keep growing your team during Navratri!
          </div>
        )}

        <button type="button" className="btn btn-primary navratri-cta" onClick={dismiss}>
          Got it — Keep Growing
        </button>
      </div>
    </div>
  );
}
