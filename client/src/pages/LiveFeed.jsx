import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';

const NAME_POOLS = {
  INDIA: [
    'Rahul Sharma',
    'Priya Patel',
    'Amit Kumar',
    'Sneha Reddy',
    'Vikram Singh',
    'Ananya Gupta',
    'Rohan Mehta',
    'Kavita Nair',
    'Suresh Iyer',
    'Neha Joshi',
  ],
  USA: [
    'James Miller',
    'Emily Johnson',
    'Michael Brown',
    'Sarah Davis',
    'David Wilson',
    'Jessica Martinez',
    'Christopher Lee',
    'Amanda Taylor',
  ],
  PAKISTAN: [
    'Ahmed Khan',
    'Fatima Ali',
    'Hassan Raza',
    'Ayesha Malik',
    'Usman Sheikh',
    'Sana Iqbal',
    'Bilal Ahmed',
    'Maryam Hussain',
  ],
  CHINA: [
    'Wei Chen',
    'Li Wei',
    'Zhang Min',
    'Wang Fang',
    'Liu Yang',
    'Chen Hao',
    'Zhao Lei',
    'Sun Mei',
  ],
  UAE: ['Omar Al Hashimi', 'Layla Hassan', 'Yusuf Rahman', 'Noor Abdullah'],
  UK: ['Oliver Smith', 'Sophie Williams', 'Harry Thompson', 'Charlotte Evans'],
  NIGERIA: ['Chinedu Okafor', 'Amina Bello', 'Emeka Nwosu', 'Funke Adeyemi'],
};

const COUNTRIES = Object.keys(NAME_POOLS);
const MAX_ROWS = 10;
/** Show these names in the feed list with $2000–$5000 amounts */
const FEATURED_MEMBERS = [
  { name: 'Praveen kumar Rai', userId: 'GW9869420', country: 'INDIA' },
  { name: 'Bhagvati Prasad Sahu', userId: 'GW0165712', country: 'INDIA' },
];
/** ~70% credit (deposit), ~30% debit (withdraw) */
const TX_TYPES = [
  { type: 'Credit', weight: 7 },
  { type: 'Debit', weight: 3 },
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickWeighted(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[0];
}

function makeFakeId() {
  let n = '';
  for (let i = 0; i < 7; i += 1) n += Math.floor(Math.random() * 10);
  return `GW${n}`;
}

/** Amount $500–$6000, often round-ish */
function randomAmount(min = 500, max = 6000) {
  const raw = randInt(min, max);
  const modes = [raw, Math.round(raw / 10) * 10, Math.round(raw / 50) * 50, Math.round(raw / 100) * 100];
  return Number(Math.min(max, Math.max(min, pick(modes))).toFixed(2));
}

function createFakeTx(now = new Date()) {
  const { type } = pickWeighted(TX_TYPES);
  // ~35% of rows use featured members at $2000–$5000
  if (Math.random() < 0.35) {
    const featured = pick(FEATURED_MEMBERS);
    return {
      _id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: featured.userId,
      name: featured.name,
      country: featured.country,
      type,
      amount: randomAmount(2000, 5000),
      status: 'Success',
      createdAt: now.toISOString(),
    };
  }

  const country = pick(COUNTRIES);
  const name = pick(NAME_POOLS[country]);
  return {
    _id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: makeFakeId(),
    name,
    country,
    type,
    amount: randomAmount(500, 6000),
    status: 'Success',
    createdAt: now.toISOString(),
  };
}

function seedFeed(count = MAX_ROWS) {
  const rows = [];
  const now = Date.now();
  for (let i = 0; i < count; i += 1) {
    const at = new Date(now - (count - i) * 60_000);
    // Guarantee both featured names appear in the initial list
    if (i < FEATURED_MEMBERS.length) {
      const featured = FEATURED_MEMBERS[i];
      const { type } = pickWeighted(TX_TYPES);
      rows.push({
        _id: `${at.getTime()}-feat-${i}`,
        userId: featured.userId,
        name: featured.name,
        country: featured.country,
        type,
        amount: randomAmount(2000, 5000),
        status: 'Success',
        createdAt: at.toISOString(),
      });
    } else {
      rows.push(createFakeTx(at));
    }
  }
  return rows.reverse();
}

const TODAY_FIXED = 30645;

export default function LiveFeed() {
  const [rows, setRows] = useState(() => seedFeed(10));
  const [grandTotal, setGrandTotal] = useState(() => randInt(180000, 420000));

  useEffect(() => {
    const t = setInterval(() => {
      const row = createFakeTx(new Date());
      setRows((prev) => [row, ...prev].slice(0, MAX_ROWS));
      // Today stays fixed at $30,645; credits/debits only refresh the feed list
      if (row.type === 'Credit') {
        setGrandTotal((v) => Number((v + row.amount).toFixed(0)));
      }
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <PageHeader title="System Live Feed" subtitle="Live platform credit & debit activity" />
      <div className="mp-stat-row">
        <div className="card mp-stat">
          <span>Total Investment</span>
          <strong>${Number(grandTotal).toLocaleString()}</strong>
        </div>
        <div className="card mp-stat">
          <span>Today</span>
          <strong>${TODAY_FIXED.toLocaleString()}</strong>
        </div>
      </div>
      <DataTable
        columns={[
          { key: 'userId', label: 'User ID' },
          { key: 'name', label: 'Name' },
          { key: 'country', label: 'Country' },
          {
            key: 'type',
            label: 'Type',
            render: (r) => (
              <span style={{ color: r.type === 'Credit' ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                {r.type}
              </span>
            ),
          },
          {
            key: 'amount',
            label: 'Amount',
            render: (r) => (
              <span style={{ color: r.type === 'Credit' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                {r.type === 'Credit' ? '+' : '−'}${Number(r.amount).toFixed(2)}
              </span>
            ),
          },
          { key: 'status', label: 'Status' },
          { key: 'date', label: 'Time', render: (r) => new Date(r.createdAt).toLocaleString() },
        ]}
        rows={rows}
      />
    </div>
  );
}
