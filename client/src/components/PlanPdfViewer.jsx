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
          src="/plan.png"
          alt="Grow Wealth Executive Business & MLM Plan — BEP-20 Staking & Referral Compensation Structure"
        />
      </div>
    </div>
  );
}
