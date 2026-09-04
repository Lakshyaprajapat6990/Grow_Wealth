import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const faqs = [
  {
    q: 'What is Grow Wealth?',
    a: 'Grow Wealth is a crypto investment platform on USDT BEP-20. Join from $1, deposit any amount after activation, earn 1% ROI credited manually 24/7, and withdraw to your crypto wallet.',
  },
  {
    q: 'How do I activate my account?',
    a: 'Register, add your BEP-20 wallet, deposit USDT, then activate joining with only $1 from the dashboard.',
  },
  {
    q: 'What is the ROI?',
    a: 'Grow Wealth offers 1% ROI. Credits are processed manually by admin and are available 24/7 — not limited to a short daily window.',
  },
  {
    q: 'How do deposits work?',
    a: 'Deposit USDT on the BEP-20 (BSC) network using Connect Wallet or Address/QR. After joining, you can deposit any amount you want.',
  },
  {
    q: 'What are the withdrawal rules?',
    a: 'First withdrawal minimum is $10. After your first successful withdrawal, you can withdraw any amount to your saved crypto wallet.',
  },
];

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function go(id) {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="lp">
      <header className={`lp-nav ${scrolled ? 'is-solid' : ''}`}>
        <div className="lp-nav-inner">
          <Link to="/" className="lp-brand">
            <span className="lp-brand-mark" aria-hidden />
            <span>
              GROW<em>WEALTH</em>
            </span>
          </Link>

          <nav className={`lp-links ${menuOpen ? 'open' : ''}`}>
            <button type="button" onClick={() => go('home')}>
              Home
            </button>
            <button type="button" onClick={() => go('ecosystem')}>
              Ecosystem
            </button>
            <button type="button" onClick={() => go('plans')}>
              Plans
            </button>
            <button type="button" onClick={() => go('faq')}>
              FAQ
            </button>
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              Login
            </Link>
          </nav>

          <div className="lp-nav-cta">
            <Link to="/login" className="btn btn-ghost lp-btn-login">
              Login
            </Link>
            <Link to="/register" className="btn btn-primary">
              Create Free Account
            </Link>
            <button type="button" className="lp-burger" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="lp-hero" id="home">
        <div className="lp-hero-glow" aria-hidden />
        <div className="lp-hero-grid">
          <div className="lp-hero-copy">
            <p className="lp-kicker">Secure Crypto Investment Platform</p>
            <h1>
              GROW
              <span>WEALTH</span>
            </h1>
            <p className="lp-lead">
              Start with just <strong>$1 joining</strong>. Deposit any amount after activation. Earn{' '}
              <strong>1% ROI</strong> — credited manually, available <strong>24/7</strong>. Withdraw to your USDT
              BEP-20 wallet.
            </p>
            <div className="lp-hero-actions">
              <Link to="/register" className="btn btn-primary lp-btn-lg">
                Start Earning Today
              </Link>
              <button type="button" className="btn btn-ghost lp-btn-lg" onClick={() => go('ecosystem')}>
                Explore Ecosystem
              </button>
            </div>
            <div className="lp-hero-pills">
              <span>USDT BEP-20</span>
              <span>Connect Wallet + QR</span>
              <span>First WD min $10</span>
            </div>
          </div>

          <div className="lp-hero-visual" aria-hidden>
            <div className="lp-orb lp-orb-1" />
            <div className="lp-orb lp-orb-2" />
            <div className="lp-hero-card">
              <div className="lp-hero-card-top">
                <span>Live Snapshot</span>
                <strong>1% ROI</strong>
              </div>
              <div className="lp-meter">
                <div className="lp-meter-fill" />
              </div>
              <ul>
                <li>
                  <span>Joining</span>
                  <b>$1</b>
                </li>
                <li>
                  <span>Network</span>
                  <b>BEP-20</b>
                </li>
                <li>
                  <span>Credit mode</span>
                  <b>Manual 24/7</b>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ECOSYSTEM */}
      <section className="lp-section" id="ecosystem">
        <div className="lp-wrap">
          <div className="lp-section-head">
            <p className="lp-kicker">How We Generate Value</p>
            <h2>
              The Engine Behind Your
              <br />
              <span>Daily 1% Returns</span>
            </h2>
            <p>
              Grow Wealth pools member liquidity for structured crypto market strategies. A portion of platform
              performance is shared back as ROI, while the network rewards community growth.
            </p>
          </div>

          <div className="lp-eco-grid">
            <article className="lp-eco-card">
              <div className="lp-eco-icon">◈</div>
              <h3>Algorithmic Crypto Trading</h3>
              <p>24/7 market participation across major crypto venues to support platform yield.</p>
            </article>
            <article className="lp-eco-card">
              <div className="lp-eco-icon">◇</div>
              <h3>Liquidity & Community</h3>
              <p>Member deposits power liquidity — and referral growth unlocks network incomes.</p>
            </article>
          </div>

          <div className="lp-steps-panel">
            <h3>Start Earning in 3 Simple Steps</h3>
            <div className="lp-steps">
              <div className="lp-step">
                <span>1</span>
                <div>
                  <h4>Deposit USDT</h4>
                  <p>Add funds using Connect Wallet or Address/QR on BEP-20.</p>
                </div>
              </div>
              <div className="lp-step">
                <span>2</span>
                <div>
                  <h4>Activate Joining</h4>
                  <p>Upgrade with only $1 to unlock earning & withdrawals.</p>
                </div>
              </div>
              <div className="lp-step">
                <span>3</span>
                <div>
                  <h4>Earn & Withdraw</h4>
                  <p>Receive 1% ROI (manual 24/7) and withdraw to your wallet.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section className="lp-section lp-section-alt" id="plans">
        <div className="lp-wrap">
          <div className="lp-section-head center">
            <p className="lp-kicker">Plans</p>
            <h2>
              Simple Entry. <span>Flexible Growth.</span>
            </h2>
            <p>No heavy package lock for entry — join light, deposit as you grow.</p>
          </div>

          <div className="lp-table-wrap">
            <table className="lp-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>ROI</th>
                  <th>Credit</th>
                  <th>Withdraw</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Joining</td>
                  <td>$1 only</td>
                  <td>1%</td>
                  <td>Manual · 24/7</td>
                  <td>First min $10</td>
                </tr>
                <tr>
                  <td>Top-up</td>
                  <td>Any amount</td>
                  <td>1%</td>
                  <td>Manual · 24/7</td>
                  <td>Any after first</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="lp-table-note">* After joining, deposit any amount you want via crypto wallet (USDT BEP-20).</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="lp-section" id="faq">
        <div className="lp-wrap lp-faq-wrap">
          <div className="lp-section-head center">
            <p className="lp-kicker">FAQ</p>
            <h2>
              Everything you need to know about <span>Grow Wealth</span>
            </h2>
          </div>

          <div className="lp-faq">
            {faqs.map((item, i) => (
              <button
                key={item.q}
                type="button"
                className={`lp-faq-item ${openFaq === i ? 'open' : ''}`}
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
              >
                <div className="lp-faq-q">
                  <span>{item.q}</span>
                  <em>{openFaq === i ? '−' : '+'}</em>
                </div>
                {openFaq === i && <p className="lp-faq-a">{item.a}</p>}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <div className="lp-wrap lp-cta-inner">
          <h2>Start Your Growth Journey Today</h2>
          <p>Join Grow Wealth now to unlock 1% ROI and build with crypto on BEP-20.</p>
          <Link to="/register" className="btn btn-primary lp-btn-lg">
            Create Free Account
          </Link>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-inner">
          <div className="lp-brand">
            <span className="lp-brand-mark" aria-hidden />
            <span>
              GROW<em>WEALTH</em>
            </span>
          </div>
          <p>© {new Date().getFullYear()} Grow Wealth. USDT BEP-20 platform.</p>
        </div>
      </footer>
    </div>
  );
}
