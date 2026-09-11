import PageHeader from '../components/PageHeader';
import PlanPdfViewer from '../components/PlanPdfViewer';

export default function PlanDetails() {
  return (
    <div>
      <PageHeader
        title="Plan Details"
        subtitle="Official client business plan PDF · BEP-20 Staking & Referral"
      />
      <div className="card" style={{ padding: '1rem' }}>
        <PlanPdfViewer />
      </div>
    </div>
  );
}
