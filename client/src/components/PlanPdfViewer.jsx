import './PlanPdfViewer.css';

/**
 * Shows the client plan as a full image (no chrome / no download bar).
 */
export default function PlanPdfViewer() {
  return (
    <div className="plan-pdf">
      <div className="plan-pdf-image-wrap">
        <img
          className="plan-pdf-image"
          src="/plan.png?v=20260916"
          alt="Grow Wealth Executive Business Plan - BEP-20 Staking and Referral Compensation Structure"
          loading="lazy"
          decoding="async"
          width="1489"
          height="2106"
        />
      </div>
    </div>
  );
}
