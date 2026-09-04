import PageHeader from '../components/PageHeader';

export default function PlanDetails() {
  return (
    <div>
      <PageHeader title="Plan Details" subtitle="Grow Wealth investment rules" />
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <h3 style={{ marginTop: 0, color: '#93c5fd' }}>Grow Wealth Plan</h3>
        <table className="mp-table">
          <thead>
            <tr>
              <th>Rule</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Joining Amount</td><td>$1 only</td></tr>
            <tr><td>After Joining Deposit</td><td>Any amount (flexible)</td></tr>
            <tr><td>ROI</td><td>1% · Admin manual credit · 24/7</td></tr>
            <tr><td>Network</td><td>USDT BEP-20 (BSC)</td></tr>
            <tr><td>Withdrawals</td><td>24/7 · Admin manual payout</td></tr>
            <tr><td>First Withdrawal</td><td>Min $10</td></tr>
            <tr><td>After First Withdrawal</td><td>Any amount</td></tr>
            <tr><td>Wallet UX</td><td>Connect Wallet + Address/QR</td></tr>
          </tbody>
        </table>
      </div>
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ marginTop: 0, color: '#93c5fd' }}>Income Types</h3>
        <ul style={{ color: '#8ba3c7', lineHeight: 2 }}>
          <li>ROI Income — 1% · admin manual credit · 24/7</li>
          <li>Direct Income — admin manual credit</li>
          <li>Level Income — admin manual credit</li>
          <li>Monthly Salary — admin manual credit</li>
          <li>Fast Track — admin manual credit</li>
        </ul>
      </div>
    </div>
  );
}
