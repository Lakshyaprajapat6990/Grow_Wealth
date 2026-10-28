import { useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';

export default function ChangePassword() {
  const { setSession } = useAuth();
  const [step, setStep] = useState(1);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function verifyOld(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-password', { oldPassword });
      setMsg(data.message || 'Password verified');
      setStep(2);
    } catch (error) {
      setErr(error.response?.data?.message || 'Could not verify password');
    } finally {
      setLoading(false);
    }
  }

  async function updatePassword(e) {
    e.preventDefault();
    setErr('');
    setMsg('');

    if (newPassword.length < 6) {
      setErr('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr('New password and confirm password do not match');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/change-password', {
        oldPassword,
        newPassword,
        confirmPassword,
      });
      if (data.token && data.user) setSession(data);
      setMsg(data.message || 'Password updated successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStep(1);
    } catch (error) {
      setErr(error.response?.data?.message || 'Could not update password');
      if (error.response?.status === 400 && /current password/i.test(error.response?.data?.message || '')) {
        setStep(1);
        setNewPassword('');
        setConfirmPassword('');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Change Password"
        subtitle="Step 1: verify your current login password · Step 2: set a new one"
      />

      <div className="card" style={{ padding: '1.25rem', maxWidth: 480 }}>
        {err && <div className="alert alert-error">{err}</div>}
        {msg && <div className="alert alert-success">{msg}</div>}

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Step {step} of 2 · Login password only (not Transaction Password)
        </p>

        {step === 1 ? (
          <form onSubmit={verifyOld}>
            <div className="field">
              <label className="label">Current Password</label>
              <input
                className="input"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <button className="btn btn-primary" disabled={loading || !oldPassword}>
              {loading ? 'Checking…' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={updatePassword}>
            <div className="field">
              <label className="label">New Password</label>
              <input
                className="input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
            <div className="field">
              <label className="label">Confirm New Password</label>
              <input
                className="input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" disabled={loading}>
                {loading ? 'Updating…' : 'Update Password'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={loading}
                onClick={() => {
                  setStep(1);
                  setErr('');
                  setMsg('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
