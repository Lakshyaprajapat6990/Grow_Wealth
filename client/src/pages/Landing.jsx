import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CertificatesSection from '../components/CertificatesSection';
import PlanPdfViewer from '../components/PlanPdfViewer';
import './Landing.css';

const faqs = [
  {
    q: 'What is Grow Wealth?',
    a: 'Grow Wealth is a crypto staking & referral platform on USDT BEP-20. Stake from $10 (up to $50,000), earn 1% daily ROI (capped at 2× investment), get 5% direct income, and withdraw with a 10% fee.',
  },
  {
    q: 'How do I activate my account?',
    a: 'Register with your BEP-20 wallet, deposit at least $10 USDT, then activate joining from the dashboard. Your sponsor earns 5% direct income on your joining.',
  },
  {
    q: 'What is the ROI?',
    a: '1% daily ROI is credited automatically all 7 days of the week, based on your deposit/fund base. Total ROI stops at 2× your investment. Compounding is manual.',
  },
  {
    q: 'How do deposits work?',
    a: 'Deposit USDT on BEP-20 (BSC) via Connect Wallet or Address/QR. Package range: min $10, $1 increments, max $50,000. Admin credits after Tx Hash verification.',
  },
  {
    q: 'What are the withdrawal rules?',
    a: 'Minimum withdrawal is always $10. Every withdrawal has a 10% fee; net amount is paid to your saved crypto wallet after admin approval.',
  },
];

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    if (window.location.pathname === '/certificates' || window.location.hash === '#certificates') {
      setTimeout(() => document.getElementById('certificates')?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
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
            <button type="button" onClick={() => go('certificates')}>
              Certificates
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
              Stake from <strong>$10</strong> (max $50,000). Earn <strong>1% daily ROI</strong> (2×
              cap) · <strong>5% direct</strong> · L1–L7 level income. Manual compound. Withdraw min $10
              with 10% fee.
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
              <span>Min package $10</span>
              <span>WD fee 10%</span>
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
                  <span>Package</span>
                  <b>$10–$50k</b>
                </li>
                <li>
                  <span>Network</span>
                  <b>BEP-20</b>
                </li>
                <li>
                  <span>ROI Cap</span>
                  <b>2× investment</b>
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
                  <p>Add funds ($10–$50,000) using Connect Wallet or Address/QR on BEP-20.</p>
                </div>
              </div>
              <div className="lp-step">
                <span>2</span>
                <div>
                  <h4>Activate Joining</h4>
                  <p>Activate with $10 from fund balance to unlock ROI, direct 5%, and withdrawals.</p>
                </div>
              </div>
              <div className="lp-step">
                <span>3</span>
                <div>
                  <h4>Earn & Withdraw</h4>
                  <p>1% daily ROI (2× cap), manual compound, withdraw min $10 with 10% fee.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLANS — real client PDF */}
      <section className="lp-section lp-section-alt" id="plans">
        <div className="lp-wrap">
          <div className="lp-section-head center">
            <p className="lp-kicker">Business Plan</p>
            <h2>
              Official Plan <span>Document</span>
            </h2>
            <p>Blockchain BEP-20 Staking &amp; Referral Compensation.</p>
          </div>
          <PlanPdfViewer />
        </div>
      </section>

      <CertificatesSection />

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
          <p>Join Grow Wealth — $10 package, 1% daily ROI (2× cap), USDT BEP-20.</p>
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
