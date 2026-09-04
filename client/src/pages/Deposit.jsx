import { useEffect, useMemo, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Deposit() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('qr');
  const [amount, setAmount] = useState('10');
  const [txHash, setTxHash] = useState('');
  const [depositAddress, setDepositAddress] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletInfo, setWalletInfo] = useState(null);
  const [pending, setPending] = useState([]);

  async function load() {
    const [addr, info, hist] = await Promise.all([
      api.get('/wallet/deposit-address'),
      api.get('/wallet/info'),
      api.get('/wallet/history'),
    ]);
    setDepositAddress(addr.data.address);
    setWalletInfo(info.data);
    setPending((hist.data.history || []).filter((h) => h.type === 'deposit' && h.status === 'pending'));
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const qrUrl = useMemo(
    () =>
      depositAddress
        ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(depositAddress)}`
        : '',
    [depositAddress]
  );

  async function copyAddress() {
    await navigator.clipboard.writeText(depositAddress);
    setMsg('Deposit address copied');
  }

  async function connectWallet() {
    setErr('');
    setMsg('');
    try {
      if (!window.ethereum) {
        setErr('MetaMask / Web3 wallet not found. Use Address/QR tab or install MetaMask.');
        return;
      }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0x38') {
        setErr('Wrong Network. Please switch to BSC (BEP-20).');
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x38' }],
          });
        } catch {
          /* user rejected */
        }
        return;
      }
      setMsg(`Wallet connected: ${accounts[0]}. Send USDT (BEP-20) to the deposit address, then submit Tx Hash below.`);
    } catch (e) {
      setErr(e.message || 'Wallet connect failed');
    }
  }

  async function submitDeposit(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    setLoading(true);
    try {
      const { data } = await api.post('/wallet/deposit', {
        amount: Number(amount),
        txHash: txHash.trim(),
        method: tab === 'connect' ? 'wallet_connect' : 'address_qr',
      });
      refreshUser(data.user);
      setMsg(data.message);
      setTxHash('');
      await load();
    } catch (error) {
      setErr(error.response?.data?.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Deposit USDT</h1>
      <p className="page-sub">Send USDT on BEP-20 (BSC) only · Admin credits after Tx verify</p>

      <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button className={`btn ${tab === 'qr' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('qr')}>
            Address / QR
          </button>
          <button
            className={`btn ${tab === 'connect' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab('connect')}
          >
            Connect Wallet
          </button>
        </div>

        {tab === 'qr' ? (
          <div style={{ display: 'grid', gap: '1rem', justifyItems: 'start' }}>
            {qrUrl && (
              <img src={qrUrl} alt="Deposit QR" style={{ borderRadius: 12, background: '#fff', padding: 8 }} />
            )}
            <div>
              <div className="label">Company Deposit Address (USDT · BEP-20)</div>
              <code style={{ wordBreak: 'break-all', color: 'var(--accent)' }}>{depositAddress || 'Loading...'}</code>
            </div>
            <button className="btn btn-ghost" type="button" onClick={copyAddress}>
              Copy Address
            </button>
            <p style={{ color: '#fbbf24', fontSize: '0.85rem', margin: 0 }}>
              Send only USDT on BNB Smart Chain (BEP-20). Other networks = permanent loss.
            </p>
          </div>
        ) : (
          <div>
            <p style={{ color: 'var(--text-muted)' }}>
              Connect MetaMask / Trust Wallet. Network must be BSC (BEP-20), then send USDT to company address.
            </p>
            <button className="btn btn-primary" type="button" onClick={connectWallet}>
              Connect Wallet
            </button>
          </div>
        )}
      </div>

      <form className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }} onSubmit={submitDeposit}>
        <h3 style={{ marginTop: 0 }}>Submit Deposit Proof</h3>
        <p style={{ color: 'var(--text-muted)' }}>
          Fund balance: ${(walletInfo?.fundBalance ?? user?.fundBalance ?? 0).toFixed(2)}
        </p>
        {err && <div className="alert alert-error">{err}</div>}
        {msg && <div className="alert alert-success">{msg}</div>}
        <div className="field">
          <label className="label">Amount (USDT)</label>
          <input
            className="input"
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label className="label">Tx Hash (required)</label>
          <input
            className="input"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder="0x..."
            required
          />
        </div>
        <button className="btn btn-success" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit for Admin Approval'}
        </button>
      </form>

      {pending.length > 0 && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ marginTop: 0 }}>Pending Deposits</h3>
          {pending.map((p) => (
            <div key={p._id} style={{ borderTop: '1px solid var(--border)', padding: '0.65rem 0' }}>
              <strong>${Number(p.amount).toFixed(2)}</strong> · {p.status} · {new Date(p.createdAt).toLocaleString()}
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                {p.meta?.txHash}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
