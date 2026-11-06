import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { mustContactForWithdraw, WITHDRAW_CONTACT } from '../constants/withdrawContactGate';
import './WithdrawContactPopup.css';

export default function WithdrawContactPopup({ forceOpen = false }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || !mustContactForWithdraw(user.userId)) {
      setOpen(false);
      return;
    }
    setOpen(true);
  }, [user, forceOpen]);

  if (!open || !user || !mustContactForWithdraw(user.userId)) return null;

  return (
    <div className="wd-contact-overlay" role="dialog" aria-modal="true" aria-labelledby="wd-contact-title">
      <div className="wd-contact-modal">
        <h2 id="wd-contact-title">Confirm your withdrawal</h2>
        <p>{WITHDRAW_CONTACT.message}</p>
        <a className="wd-contact-phone" href={`tel:${WITHDRAW_CONTACT.phoneTel}`}>
          {WITHDRAW_CONTACT.name}: {WITHDRAW_CONTACT.phone}
        </a>
        <div>
          <button type="button" className="btn btn-primary" onClick={() => setOpen(false)}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
