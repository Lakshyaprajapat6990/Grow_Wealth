import { useState } from 'react';
import './Certificates.css';

const CERTS = [
  {
    id: 'cbp',
    label: 'Digital Asset Professional',
    style: 'classic',
  },
  {
    id: 'trader',
    label: 'Certified Crypto Trader',
    style: 'modern',
  },
];

function ClassicCert() {
  return (
    <article className="cert cert-classic" aria-label="Grow Wealth Digital Asset Professional Certificate">
      <div className="cert-classic-frame">
        <div className="cert-classic-inner">
          <p className="cert-classic-org">Grow Wealth Certification Board</p>
          <p className="cert-classic-award">The Board of Directors hereby awards</p>
          <p className="cert-classic-name">Grow Wealth Platform</p>
          <p className="cert-classic-of">the credential of</p>
          <h3 className="cert-classic-title">Certified Digital Asset Professional</h3>
          <p className="cert-classic-body">
            Having agreed to uphold the Code of Ethics and Operations Standard, and having completed the competency
            examination for USDT BEP-20 staking systems, this credential remains valid subject to annual review.
          </p>
          <div className="cert-classic-foot">
            <div className="cert-classic-logo">
              <span className="cert-seal-mark" aria-hidden />
              <div>
                <strong>GROW WEALTH</strong>
                <small>CERTIFICATION BOARD</small>
              </div>
            </div>
            <div className="cert-classic-meta">
              <span>Issued: 2025-01-15</span>
              <span>Certificate No: GW-DAP-8F2A91</span>
              <span className="cert-badge">DAP</span>
            </div>
          </div>
          <p className="cert-classic-verify">
            Verify authenticity: grow-wealth-neon.vercel.app/certificates#GW-DAP-8F2A91
          </p>
        </div>
      </div>
    </article>
  );
}

function ModernCert() {
  return (
    <article className="cert cert-modern" aria-label="Grow Wealth Certified Crypto Trader Certificate">
      <div className="cert-modern-top">
        <div className="cert-modern-brand">
          <span className="cert-modern-orb" aria-hidden />
          <span>Grow Wealth</span>
        </div>
        <h3>Certified Crypto Trader</h3>
        <div className="cert-modern-meta-row">
          <span>
            <em>No:</em> 5984308245245
          </span>
          <span>
            <em>Date:</em> 09.07.2025
          </span>
          <span>
            <em>Verify:</em> grow-wealth-neon.vercel.app
          </span>
        </div>
      </div>

      <div className="cert-modern-mid">
        <div>
          <p className="cert-modern-label">Awarded to</p>
          <p className="cert-modern-recipient">Grow Wealth Operations</p>
        </div>
        <div>
          <p className="cert-modern-label">For completing the</p>
          <p className="cert-modern-program">BEP-20 Staking &amp; Liquidity Program</p>
          <p className="cert-modern-desc">
            The program included fundamental &amp; technical analysis, trading psychology, DeFi strategies, and yield
            optimization techniques on USDT BEP-20.
          </p>
        </div>
      </div>

      <div className="cert-modern-bottom">
        <div className="cert-modern-stats">
          <div>
            <strong>16-Week Intensive Training (72 Hours)</strong>
            <small>Training Duration</small>
          </div>
          <div>
            <strong>Simulated Portfolio Growth: +31%</strong>
            <small>Performance Metric</small>
          </div>
        </div>
        <div className="cert-modern-sign">
          <div>
            <strong>Alexandra R. Hayes</strong>
            <small>Director / Senior Analyst</small>
          </div>
          <p className="cert-signature">A. Hayes</p>
          <span className="cert-modern-signed">Signed: 09.23.2025</span>
        </div>
      </div>
    </article>
  );
}

export default function CertificatesSection() {
  const [active, setActive] = useState(null);

  return (
    <section className="lp-section lp-certs" id="certificates">
      <div className="lp-wrap">
        <div className="lp-section-head center">
          <p className="lp-kicker">Credentials</p>
          <h2>
            Platform <span>Certificates</span>
          </h2>
          <p>Official-looking credentials for Grow Wealth operations, trading standards, and BEP-20 compliance.</p>
        </div>

        <div className="lp-certs-grid">
          {CERTS.map((c) => (
            <button
              key={c.id}
              type="button"
              className="lp-cert-preview"
              onClick={() => setActive(c.id)}
              aria-label={`View ${c.label} certificate`}
            >
              <div className="lp-cert-preview-frame">
                {c.style === 'classic' ? <ClassicCert /> : <ModernCert />}
              </div>
              <span className="lp-cert-preview-label">{c.label}</span>
              <span className="lp-cert-preview-hint">Click to enlarge</span>
            </button>
          ))}
        </div>
      </div>

      {active && (
        <div className="cert-lightbox" role="dialog" aria-modal="true" onClick={() => setActive(null)}>
          <button type="button" className="cert-lightbox-close" onClick={() => setActive(null)} aria-label="Close">
            ×
          </button>
          <div className="cert-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            {active === 'cbp' ? <ClassicCert /> : <ModernCert />}
          </div>
        </div>
      )}
    </section>
  );
}
