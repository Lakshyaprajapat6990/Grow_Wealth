import { useState } from 'react';
import './Certificates.css';

const CERTS = [
  {
    id: 'cbp',
    label: 'Digital Asset Professional',
    src: '/certificates/certificate-digital-asset-professional.png',
    alt: 'Grow Wealth Certified Digital Asset Professional certificate',
  },
  {
    id: 'trader',
    label: 'Certified Crypto Trader',
    src: '/certificates/certificate-crypto-trader.png',
    alt: 'Grow Wealth Certified Crypto Trader certificate',
  },
];

export default function CertificatesSection() {
  const [active, setActive] = useState(null);
  const activeCert = CERTS.find((c) => c.id === active);

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
                <img
                  className="lp-cert-img"
                  src={c.src}
                  alt={c.alt}
                  loading="lazy"
                  decoding="async"
                  width="1200"
                  height="848"
                />
              </div>
              <span className="lp-cert-preview-label">{c.label}</span>
              <span className="lp-cert-preview-hint">Click to enlarge</span>
            </button>
          ))}
        </div>

        <div className="lp-cert-downloads">
          {CERTS.map((c) => (
            <a key={c.id} className="btn btn-ghost" href={c.src} download>
              Download {c.label}
            </a>
          ))}
        </div>
      </div>

      {activeCert && (
        <div className="cert-lightbox" role="dialog" aria-modal="true" onClick={() => setActive(null)}>
          <button type="button" className="cert-lightbox-close" onClick={() => setActive(null)} aria-label="Close">
            ×
          </button>
          <div className="cert-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <img
              className="cert-lightbox-img"
              src={activeCert.src}
              alt={activeCert.alt}
              decoding="async"
              width="1200"
              height="848"
            />
          </div>
        </div>
      )}
    </section>
  );
}
