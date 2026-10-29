import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CertificatesSection from '../components/CertificatesSection';
import './Landing.css';

const faqs = [
  {
    q: 'What is Grow Wealth?',
    a: 'Grow Wealth is a crypto staking & referral platform on USDT BEP-20. Stake from $10 (up to $50,000), earn Monthly Salary from team business, 1% daily ROI (capped at 2× investment), Refer & Earn on joins (L1 5% · L2 2% · L3 1%), and withdraw with an 8% fee (24–48h process).',
  },
  {
    q: 'What is the Monthly Salary Plan?',
    a: 'Downline team business unlocks a monthly USDT salary (highest tier only): $3,000 → $180 · $5,000 → $270 · $7,000 → $450 · $10,000 → $600 · $15,000 → $750 · $20,000+ → $1,000. Paid once per month while you stay qualified.',
  },
  {
    q: 'How do I activate my account?',
    a: 'Register with your BEP-20 wallet and deposit at least $10 USDT. Joining activates automatically after your deposit is credited. Your sponsor (L1) earns 5%, their sponsor (L2) 2%, and L3 earns 1% of your joining amount.',
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
    a: 'Minimum withdrawal is $10 with an 8% fee. Max 1 request per day (UTC). Net amount is paid to your saved wallet after admin approval (24–48h). All joined members can withdraw.',
  },
];

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    if (window.location.pathname === '/certificates' || window.location.hash === '#certificates') {
      setTimeout(() => document.getElementById('certificates')?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('menu-locked', menuOpen);
    return () => document.body.classList.remove('menu-locked');
  }, [menuOpen]);

  function go(id) {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="lp">
      <header className={`lp-nav ${scrolled ? 'is-solid' : ''}`}>
        <div className="lp-nav-inner">
          <Link to="/" className="lp-brand">
            <img className="lp-brand-logo" src="/logo.png" alt="Grow Wealth" width="48" height="48" />
          </Link>

          <nav className={`lp-links ${menuOpen ? 'open' : ''}`}>
            <button type="button" onClick={() => go('home')}>
              Home
            </button>
            <button type="button" onClick={() => go('ecosystem')}>
              Ecosystem
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
            <Link to="/register" className="btn btn-primary lp-btn-register">
              Sign Up
            </Link>
            <button
              type="button"
              className="lp-burger"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
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
              <strong>Monthly Salary Plan</strong> — team business pays every month ($3k → $180 · $5k → $270 · $7k →
              $450 · $10k → $600 · $15k → $750 · $20k+ → $1,000). Stake from{' '}
              <strong>$10</strong> (max $50,000) · <strong>1% daily ROI</strong> (2× cap) ·{' '}
              <strong>Refer & Earn</strong> (L1 5% · L2 2% · L3 1%). Manual compound · WD min $10 · 8% fee · 24–48h.
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
              <span>Monthly Salary</span>
              <span>USDT BEP-20</span>
              <span>Min package $10</span>
            </div>
          </div>

          <div className="lp-hero-visual" aria-hidden>
            <div className="lp-orb lp-orb-1" />
            <div className="lp-orb lp-orb-2" />
            <div className="lp-hero-card">
              <div className="lp-hero-card-top">
                <span>Live Snapshot</span>
                <strong>Salary Plan</strong>
              </div>
              <div className="lp-meter">
                <div className="lp-meter-fill" />
              </div>
              <ul>
                <li>
                  <span>Salary / mo</span>
                  <b>$180–$1,000</b>
                </li>
                <li>
                  <span>Team from</span>
                  <b>$3,000</b>
                </li>
                <li>
                  <span>Daily ROI</span>
                  <b>1% · 2× cap</b>
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
              <p>
                Member deposits power liquidity — referral growth unlocks Refer & Earn and Monthly Salary from team
                business.
              </p>
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
                  <h4>Auto Activate</h4>
                  <p>After your deposit is credited, joining activates automatically — ROI and Refer & Earn unlock.</p>
                </div>
              </div>
              <div className="lp-step">
                <span>3</span>
                <div>
                  <h4>Earn & Withdraw</h4>
                  <p>
                    Monthly Salary from team business, 1% daily ROI (2× cap), manual compound. Withdraw min $10 · 8% fee ·
                    max 1/day.
                  </p>
                </div>
              </div>
            </div>
          </div>
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
          <p>Join Grow Wealth — Monthly Salary Plan, $10 package, 1% daily ROI (2× cap), USDT BEP-20.</p>
          <Link to="/register" className="btn btn-primary lp-btn-lg">
            Create Free Account
          </Link>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-inner">
          <div className="lp-brand">
            <img className="lp-brand-logo" src="/logo.png" alt="Grow Wealth" width="48" height="48" />
          </div>
          <p>© {new Date().getFullYear()} Grow Wealth. USDT BEP-20 platform.</p>
        </div>
      </footer>
    </div>
  );
}
