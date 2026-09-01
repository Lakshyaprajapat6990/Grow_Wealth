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

  useEffect(() => {
    api.get('/wallet/deposit-address').then((r) => setDepositAddress(r.data.address)).catch(() => {});
    api.get('/wallet/info').then((r) => setWalletInfo(r.data)).catch(() => {});
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
      setMsg(`Wallet connected: ${accounts[0]} — send USDT then submit amount below to credit (Phase 2 watcher coming next).`);
    } catch (e) {
      setErr(e.message || 'Wallet connect failed');
    }
  }

  async function creditDemoDeposit(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    setLoading(true);
    try {
      const { data } = await api.post('/wallet/deposit', {
        amount: Number(amount),
        txHash: txHash || undefined,
        method: tab === 'connect' ? 'wallet_connect' : 'address_qr',
      });
      refreshUser(data.user);
      setMsg(`Deposit $${Number(amount).toFixed(2)} credited to fund balance`);
      const info = await api.get('/wallet/info');
      setWalletInfo(info.data);
    } catch (error) {
      setErr(error.response?.data?.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Deposit USDT</h1>
      <p className="page-sub">Option C — Connect Wallet + Address/QR · Network: BEP-20 (BSC)</p>

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
            <img src={qrUrl} alt="Deposit QR" style={{ borderRadius: 12, background: '#fff', padding: 8 }} />
            <div>
              <div className="label">Deposit Address (BEP-20)</div>
              <code style={{ wordBreak: 'break-all', color: 'var(--accent)' }}>{depositAddress || 'Loading...'}</code>
            </div>
            <button className="btn btn-ghost" onClick={copyAddress}>
              Copy Address
            </button>
          </div>
        ) : (
          <div>
            <p style={{ color: 'var(--text-muted)' }}>
              Connect MetaMask / Trust (WalletConnect-ready UI). Ensure network is BSC.
            </p>
            <button className="btn btn-primary" onClick={connectWallet}>
              Connect Wallet
            </button>
          </div>
        )}
      </div>

      <form className="card" style={{ padding: '1.25rem' }} onSubmit={creditDemoDeposit}>
        <h3 style={{ marginTop: 0 }}>Credit deposit to account</h3>
        <p style={{ color: 'var(--text-muted)' }}>
          Fund balance: ${(walletInfo?.fundBalance ?? user?.fundBalance ?? 0).toFixed(2)}
        </p>
        {err && <div className="alert alert-error">{err}</div>}
        {msg && <div className="alert alert-success">{msg}</div>}
        <div className="field">
          <label className="label">Amount (USDT)</label>
          <input className="input" type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Tx Hash (optional)</label>
          <input className="input" value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="0x..." />
        </div>
        <button className="btn btn-success" disabled={loading}>
          {loading ? 'Processing…' : 'Confirm Deposit Credit'}
        </button>
      </form>
    </div>
  );
}
