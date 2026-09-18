import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import {
  getEthereumProvider,
  isMobileDevice,
  openPaymentInWallet,
  WALLET_NOT_FOUND_MSG,
} from '../utils/walletProvider';
import './Auth.css';

const empty = {
  name: '',
  email: '',
  mobile: '',
  password: '',
  confirmPassword: '',
  country: 'INDIA',
  walletAddress: '',
  sponsorId: '',
  agreeTerms: false,
};

const USDT_BEP20 = '0x55d398326f99059fF775485246999027B3197955';
const PENDING_KEY = 'gw_reg_pending';

function encodeUsdtTransfer(toAddress, amountUsdt) {
  const selector = 'a9059cbb';
  const to = toAddress.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  const wei = BigInt(Math.round(Number(amountUsdt) * 1e6)) * 10n ** 12n; // 18 decimals
  const amountHex = wei.toString(16).padStart(64, '0');
  return `0x${selector}${to}${amountHex}`;
}

function persistPayInfo(info) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(info));
  } catch {
    /* ignore */
  }
  const u = new URL(window.location.href);
  u.searchParams.set('pending', info.pendingId);
  window.history.replaceState({}, '', `${u.pathname}${u.search}`);
}

function clearPayInfo() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

export default function Register() {
  const { registerStart, registerConfirm } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ ...empty, sponsorId: params.get('ref') || '' });
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [sponsorMsg, setSponsorMsg] = useState('');
  const [step, setStep] = useState(1);
  const [payInfo, setPayInfo] = useState(null);
  const [success, setSuccess] = useState(null);
  const [checking, setChecking] = useState(false);
  const [hasProvider, setHasProvider] = useState(() => !!getEthereumProvider());
  const [txHashManual, setTxHashManual] = useState('');
  const pollRef = useRef(null);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  useEffect(() => {
    if (form.sponsorId) verifySponsor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resume payment step after wallet deep-link reopens this page
  useEffect(() => {
    const pendingId = params.get('pending');
    let cached = null;
    try {
      cached = JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null');
    } catch {
      cached = null;
    }

    async function resume() {
      if (cached?.pendingId && (!pendingId || pendingId === cached.pendingId)) {
        setPayInfo(cached);
        setStep(2);
        setMsg('Continue payment in this wallet browser.');
        return;
      }
      if (!pendingId) return;
      try {
        const { data } = await api.get(`/auth/register-pending/${pendingId}`);
        if (data.status === 'pending_payment') {
          const info = {
            pendingId: data.pendingId,
            amountDue: data.amountDue,
            depositAddress: data.depositAddress,
            usdtContract: data.usdtContract || USDT_BEP20,
            walletAddress: data.walletAddress,
            chainId: data.chainId || '0x38',
          };
          persistPayInfo(info);
          setPayInfo(info);
          setStep(2);
          setMsg('Continue payment in this wallet browser.');
        }
      } catch {
        /* expired / missing */
      }
    }
    resume();
  }, [params]);

  useEffect(() => {
    setHasProvider(!!getEthereumProvider());
    const t = setInterval(() => setHasProvider(!!getEthereumProvider()), 1500);
    return () => {
      clearInterval(t);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const qrUrl = useMemo(() => {
    if (!payInfo?.depositAddress) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
      payInfo.depositAddress
    )}`;
  }, [payInfo]);

  async function verifySponsor() {
    if (!form.sponsorId) return;
    try {
      const { data } = await api.get(`/auth/check-sponsor/${form.sponsorId.trim().toUpperCase()}`);
      setSponsorMsg(data.valid ? `✓ Sponsor: ${data.name}` : data.message || 'Invalid sponsor');
    } catch {
      setSponsorMsg('Could not verify sponsor');
    }
  }

  async function onSubmitDetails(e) {
    e.preventDefault();
    setError('');
    setMsg('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!form.agreeTerms) {
      setError('Please agree to the terms of service.');
      return;
    }
    const wallet = form.walletAddress.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      setError('Valid USDT BEP-20 Wallet Address is required (0x + 40 hex characters).');
      return;
    }
    setLoading(true);
    try {
      const data = await registerStart({
        ...form,
        sponsorId: form.sponsorId.trim().toUpperCase(),
        walletAddress: wallet,
        agreeTerms: true,
      });
      const info = {
        pendingId: data.pendingId,
        amountDue: data.amountDue,
        depositAddress: data.depositAddress,
        usdtContract: data.usdtContract || USDT_BEP20,
        walletAddress: data.walletAddress || wallet.toLowerCase(),
        chainId: data.chainId || '0x38',
      };
      persistPayInfo(info);
      setPayInfo(info);
      setStep(2);
      setMsg(data.message || 'Pay USDT to finish registration.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start registration');
    } finally {
      setLoading(false);
    }
  }

  async function confirmPayment(txHash = '') {
    if (!payInfo?.pendingId) return;
    setError('');
    setChecking(true);
    try {
      const data = await registerConfirm(payInfo.pendingId, txHash);
      if (pollRef.current) clearInterval(pollRef.current);
      clearPayInfo();
      setSuccess({
        userId: data.userId,
        transactionPassword: data.transactionPassword,
        paidAmount: data.paidAmount,
        txHash: data.txHash,
      });
      setStep(3);
    } catch (err) {
      const body = err.response?.data;
      if (body?.waiting) {
        setMsg(body.message || 'Waiting for payment on BSC…');
      } else {
        setError(body?.message || 'Payment check failed');
      }
    } finally {
      setChecking(false);
    }
  }

  function startAutoPoll() {
    if (pollRef.current) clearInterval(pollRef.current);
    setMsg('Watching BSC for your payment…');
    pollRef.current = setInterval(() => {
      confirmPayment('');
    }, 12000);
  }

  async function payWithWallet() {
    setError('');
    setMsg('');
    const provider = getEthereumProvider();
    if (!provider) {
      if (isMobileDevice()) {
        setMsg('Tap SafePal, Trust, or TokenPocket below — it opens that wallet with payment details.');
        setError('');
      } else {
        setError(WALLET_NOT_FOUND_MSG);
      }
      return;
    }
    if (!payInfo) return;

    setLoading(true);
    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      const from = (accounts[0] || '').toLowerCase();
      if (from !== payInfo.walletAddress.toLowerCase()) {
        setError(
          `Connect the same wallet you registered: ${payInfo.walletAddress}. Connected: ${from}`
        );
        setLoading(false);
        return;
      }

      let chainId = await provider.request({ method: 'eth_chainId' });
      if (chainId !== '0x38') {
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x38' }],
          });
          chainId = await provider.request({ method: 'eth_chainId' });
        } catch {
          setError('Please switch to BNB Smart Chain (BEP-20).');
          setLoading(false);
          return;
        }
        if (chainId !== '0x38') {
          setError('Wrong network. Switch to BSC (BEP-20).');
          setLoading(false);
          return;
        }
      }

      const data = encodeUsdtTransfer(payInfo.depositAddress, payInfo.amountDue);
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from,
            to: payInfo.usdtContract || USDT_BEP20,
            data,
            value: '0x0',
          },
        ],
      });

      setMsg(`Payment sent. Confirming on BSC… (${txHash.slice(0, 12)}…)`);
      setTimeout(() => confirmPayment(txHash), 8000);
      startAutoPoll();
    } catch (e) {
      setError(e?.message || 'Wallet payment cancelled or failed');
    } finally {
      setLoading(false);
    }
  }

  function openWalletApp(key) {
    if (!payInfo?.depositAddress) return;
    persistPayInfo(payInfo);
    const names = { safepal: 'SafePal', trust: 'Trust Wallet', tokenpocket: 'TokenPocket' };
    if (key === 'safepal') {
      setMsg(
        'Opening SafePal… If send is not prefilled, use Pay USDT now inside SafePal, or copy address + send $10 USDT (BEP-20).'
      );
    } else {
      setMsg(
        `Opening ${names[key]} with company address + $${payInfo.amountDue} USDT prefilled. Confirm the send, then return and tap Check Payment.`
      );
    }
    openPaymentInWallet(key, {
      toAddress: payInfo.depositAddress,
      amountUsdt: payInfo.amountDue,
    });
  }

  async function copyAddress() {
    if (!payInfo?.depositAddress) return;
    await navigator.clipboard.writeText(payInfo.depositAddress);
    setMsg('Deposit address copied');
  }

  if (step === 3 && success) {
    return (
      <div className="auth-page">
        <div className="card auth-card">
          <div className="alert alert-success">Payment verified · Account ready</div>
          <p>
            Your User ID: <strong>{success.userId}</strong>
          </p>
          <p>
            Transaction Password: <strong>{success.transactionPassword}</strong>
          </p>
          <p className="muted">
            Paid ${Number(success.paidAmount || 0).toFixed(2)} USDT. Save these details — needed for
            login and withdrawals.
          </p>
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (step === 2 && payInfo) {
    return (
      <div className="auth-page">
        <div className="card auth-card wide">
          <div className="auth-brand">
            <img className="logo-img" src="/logo.png" alt="Grow Wealth" width="96" height="96" />
            <h1>Pay to Finish</h1>
            <p>
              Send <strong>${payInfo.amountDue} USDT</strong> on BEP-20 — we track it automatically
            </p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {msg && <div className="alert alert-success">{msg}</div>}

          <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
            {qrUrl && (
              <img
                src={qrUrl}
                alt="Deposit QR"
                style={{ borderRadius: 12, background: '#fff', padding: 8, width: 180 }}
              />
            )}
            <div>
              <div className="label">Company Address (USDT · BEP-20 only)</div>
              <code style={{ wordBreak: 'break-all', color: 'var(--accent)' }}>
                {payInfo.depositAddress}
              </code>
            </div>
            <button className="btn btn-ghost" type="button" onClick={copyAddress}>
              Copy Address
            </button>
            <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
              Must send from your registered wallet:{' '}
              <code style={{ wordBreak: 'break-all' }}>{payInfo.walletAddress}</code>
            </p>
          </div>

          <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
              Opens wallet with <strong>company address</strong> + <strong>${payInfo.amountDue} USDT</strong>{' '}
              filled (Trust &amp; TokenPocket). SafePal opens the app — then tap Pay or send manually.
            </p>
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              type="button"
              onClick={() => openWalletApp('trust')}
            >
              Trust Wallet · Send ${payInfo.amountDue} USDT
            </button>
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              type="button"
              onClick={() => openWalletApp('tokenpocket')}
            >
              TokenPocket · Send ${payInfo.amountDue} USDT
            </button>
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              type="button"
              onClick={() => openWalletApp('safepal')}
            >
              SafePal · Open &amp; pay ${payInfo.amountDue} USDT
            </button>
          </div>

          <button
            className="btn btn-success"
            style={{ width: '100%', marginBottom: '0.5rem' }}
            type="button"
            disabled={loading || checking || !hasProvider}
            onClick={payWithWallet}
          >
            {loading
              ? 'Opening wallet…'
              : hasProvider
                ? `Pay $${payInfo.amountDue} USDT now`
                : 'Pay USDT (open a wallet app first)'}
          </button>

          <div className="field" style={{ marginBottom: '0.75rem' }}>
            <label className="label">Tx Hash (if Check Payment fails)</label>
            <input
              className="input"
              value={txHashManual}
              onChange={(e) => setTxHashManual(e.target.value.trim())}
              placeholder="0x… paste from Trust / TokenPocket / SafePal"
            />
            <small className="hint">
              Open your wallet → transaction history → copy Tx Hash. Must pay from{' '}
              {payInfo.walletAddress.slice(0, 8)}…{payInfo.walletAddress.slice(-6)}
            </small>
          </div>

          <button
            className="btn btn-success"
            style={{ width: '100%', marginBottom: '0.5rem' }}
            type="button"
            disabled={checking || loading}
            onClick={() => {
              confirmPayment(txHashManual);
              if (!txHashManual) startAutoPoll();
            }}
          >
            {checking ? 'Checking BSC…' : 'I Paid — Check Payment'}
          </button>

          <p className="muted" style={{ fontSize: '0.85rem' }}>
            After sending, wait ~20s then Check Payment. If it still fails, paste Tx Hash above.
            Payment must come from your registered wallet.
          </p>

          <p className="auth-foot">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                if (pollRef.current) clearInterval(pollRef.current);
                setStep(1);
              }}
            >
              ← Back to details
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="card auth-card wide" onSubmit={onSubmitDetails}>
        <div className="auth-brand">
          <img className="logo-img" src="/logo.png" alt="Grow Wealth" width="96" height="96" />
          <h1>Grow Wealth</h1>
          <p>Step 1 of 2 · Your details</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="field">
          <label className="label">Sponsor ID</label>
          <input
            className="input"
            value={form.sponsorId}
            onChange={(e) => set('sponsorId', e.target.value)}
            onBlur={verifySponsor}
            placeholder="GW0000001 or leave blank"
          />
          {sponsorMsg && <small className="hint">{sponsorMsg}</small>}
        </div>

        <div className="grid-2">
          <div className="field">
            <label className="label">Full Name</label>
            <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </div>
          <div className="field">
            <label className="label">Mobile</label>
            <input className="input" value={form.mobile} onChange={(e) => set('mobile', e.target.value)} required />
          </div>
        </div>

        <div className="field">
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            required
          />
        </div>

        <div className="grid-2">
          <div className="field">
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label">Confirm Password</label>
            <input
              className="input"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => set('confirmPassword', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="field">
          <label className="label">Country</label>
          <select className="select" value={form.country} onChange={(e) => set('country', e.target.value)}>
            <option>INDIA</option>
            <option>USA</option>
            <option>UAE</option>
            <option>NIGERIA</option>
            <option>OTHER</option>
          </select>
        </div>

        <div className="field">
          <label className="label">Your USDT BEP-20 Wallet Address</label>
          <input
            className="input"
            value={form.walletAddress}
            onChange={(e) => set('walletAddress', e.target.value)}
            placeholder="0x + 40 characters"
            required
          />
          <small className="hint">
            Payment must come from this wallet. Same address used for withdrawals.
          </small>
        </div>

        <label className="check">
          <input
            type="checkbox"
            checked={form.agreeTerms}
            onChange={(e) => set('agreeTerms', e.target.checked)}
          />
          I agree to the terms of service
        </label>

        <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }} disabled={loading}>
          {loading ? 'Saving…' : 'Next · Pay $10 USDT'}
        </button>

        <p className="auth-foot">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
