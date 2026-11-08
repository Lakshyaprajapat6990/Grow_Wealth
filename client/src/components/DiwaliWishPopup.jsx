import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './DiwaliWishPopup.css';

const STORAGE_KEY = 'gw_diwali_wish_2026_dismissed';

export default function DiwaliWishPopup() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || user.role === 'admin') return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') return;
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => setOpen(true), 500);
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

  return (
    <div className="diwali-overlay" role="dialog" aria-modal="true" aria-labelledby="diwali-title">
      <div className="diwali-modal">
        <button type="button" className="diwali-close" onClick={dismiss} aria-label="Close">
          ×
        </button>

        <div className="diwali-sparkles" aria-hidden>
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="diwali-badge">Festival Wishes</div>

        <div className="diwali-media">
          <img
            className="diwali-gif"
            src="/diwali-wish.gif"
            alt="Happy Diwali animated celebration with glowing diyas"
          />
          <div className="diwali-diyas" aria-hidden>
            <span className="diya" />
            <span className="diya" />
            <span className="diya" />
            <span className="diya" />
            <span className="diya" />
          </div>
          <div className="diwali-fireworks" aria-hidden>
            <i />
            <i />
            <i />
          </div>
        </div>

        <h2 id="diwali-title">Happy Diwali</h2>
        <p className="diwali-lead">
          Dear <strong>{user.name || 'Member'}</strong>, Grow Wealth wishes you and your family a
          bright, prosperous, and joyful Diwali.
        </p>
        <p className="diwali-sub">May light, wealth, and success fill your year ahead.</p>

        <button type="button" className="btn btn-primary diwali-cta" onClick={dismiss}>
          Shubh Diwali — Continue
        </button>
      </div>
    </div>
  );
}
