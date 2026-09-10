import PageHeader from '../components/PageHeader';

const LEVELS = [
  { level: 'Level 1 (L-1)', income: '10%', target: '$500' },
  { level: 'Level 2 (L-2)', income: '12%', target: '$1,000' },
  { level: 'Level 3 (L-3)', income: '15%', target: '$1,500' },
  { level: 'Level 4 (L-4)', income: '17%', target: '$2,500' },
  { level: 'Level 5 (L-5)', income: '20%', target: '$4,000' },
  { level: 'Level 6 (L-6)', income: '23%', target: '$7,500' },
  { level: 'Level 7 (L-7)', income: '25%', target: '—' },
];

export default function PlanDetails() {
  return (
    <div>
      <PageHeader title="Plan Details" subtitle="BEP-20 Staking & Referral Compensation Structure" />

      <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <h3 style={{ marginTop: 0, color: '#93c5fd' }}>Core Package & Financial Parameters</h3>
        <table className="mp-table">
          <thead>
            <tr>
              <th>Rule</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Network</td>
              <td>USDT BEP-20 (BSC)</td>
            </tr>
            <tr>
              <td>Package / Stake</td>
              <td>Min $10 · $1 increments · Max $50,000</td>
            </tr>
            <tr>
              <td>Daily ROI</td>
              <td>1% · All 7 days · Automatic</td>
            </tr>
            <tr>
              <td>ROI Cap</td>
              <td>Maximum 2X of investment</td>
            </tr>
            <tr>
              <td>Compounding</td>
              <td>Manual Compounding</td>
            </tr>
            <tr>
              <td>Joining / Activation</td>
              <td>Min $10 from fund balance</td>
            </tr>
            <tr>
              <td>Withdrawal</td>
              <td>Min $10 · Unlimited subsequent</td>
            </tr>
            <tr>
              <td>Withdrawal Fee</td>
              <td>10%</td>
            </tr>
            <tr>
              <td>Direct Income</td>
              <td>5%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <h3 style={{ marginTop: 0, color: '#93c5fd' }}>Multi-Level Income & ROI Target Structure</h3>
        <table className="mp-table">
          <thead>
            <tr>
              <th>Level</th>
              <th>Level Income (%)</th>
              <th>ROI Target ($)</th>
            </tr>
          </thead>
          <tbody>
            {LEVELS.map((row) => (
              <tr key={row.level}>
                <td>{row.level}</td>
                <td>{row.income}</td>
                <td>{row.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 0 }}>
          Disclaimer: The maximum ROI is capped at 2X of the investment.
        </p>
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ marginTop: 0, color: '#93c5fd' }}>Income Types</h3>
        <ul style={{ color: '#8ba3c7', lineHeight: 2 }}>
          <li>Daily ROI — 1% automatic · all 7 days · capped at 2X</li>
          <li>Direct Income — 5% (to sponsor)</li>
          <li>Level Income — L1 to L7 as per table</li>
          <li>Manual Compounding — move income back to fund/stake</li>
        </ul>
      </div>
    </div>
  );
}
