import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';

const INDIAN_NAMES = [
  'Rahul Sharma',
  'Priya Patel',
  'Amit Kumar',
  'Sneha Reddy',
  'Vikram Singh',
  'Kavita Nair',
  'Suresh Iyer',
  'Neha Joshi',
  'Ramesh Yadav',
  'Sunita Devi',
  'Manoj Tiwari',
  'Pooja Verma',
  'Deepak Chouhan',
  'Rekha Pandey',
  'Sanjay Tandan',
  'Kushal Sahu',
  'Gajanan Dhole',
  'Urmila Devi',
  'Raju Rajak',
  'Upendra Gupta',
  'Ashok Patel',
  'Meena Kumari',
  'Rajesh Gupta',
  'Savita Sharma',
  'Dinesh Verma',
  'Lata Rani',
  'Mukesh Jain',
  'Seema Gupta',
  'Harish Chandra',
  'Kamla Devi',
  'Naveen Kumar',
  'Geeta Bai',
  'Mahesh Sahu',
  'Anita Yadav',
  'Sandeep Singh',
  'Kiran Bala',
  'Bharat Lal',
  'Shanti Devi',
  'Vinod Kumar',
  'Pushpa Rani',
  'Jagdish Prasad',
  'Radha Bai',
  'Om Prakash',
  'Sharda Devi',
  'Ravi Shankar',
  'Mamta Singh',
  'Alok Mishra',
  'Bharti Sahu',
  'Pradeep Yadav',
  'Nirmala Devi',
  'Santosh Kumar',
  'Asha Rani',
  'Gopal Das',
  'Hemant Sahu',
  'Sarita Verma',
  'Brijesh Tiwari',
  'Indu Sharma',
  'Yogesh Patel',
  'Chhaya Devi',
];

const MAX_ROWS = 10;

const FEATURED_MEMBERS = [
  { name: 'Praveen Kumar Rai', userId: 'GW9869420', country: 'INDIA' },
];

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

/** Random $10 – $5,000 USDT */
function randomAmount(min = 10, max = 5000) {
  const raw = randInt(min, max);
  const modes = [raw, Math.round(raw / 10) * 10, Math.round(raw / 50) * 50, Math.round(raw / 100) * 100];
  return Number(Math.min(max, Math.max(min, pick(modes))).toFixed(2));
}

function createFakeTx(now = new Date()) {
  const { type } = pickWeighted(TX_TYPES);
  if (Math.random() < 0.4) {
    const featured = pick(FEATURED_MEMBERS);
    return {
      _id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: featured.userId,
      name: featured.name,
      country: featured.country,
      type,
      amount: randomAmount(10, 5000),
      status: 'Success',
      createdAt: now.toISOString(),
    };
  }

  return {
    _id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: makeFakeId(),
    name: pick(INDIAN_NAMES),
    country: 'INDIA',
    type,
    amount: randomAmount(10, 5000),
    status: 'Success',
    createdAt: now.toISOString(),
  };
}

function seedFeed(count = MAX_ROWS) {
  const rows = [];
  const now = Date.now();
  for (let i = 0; i < count; i += 1) {
    const at = new Date(now - (count - i) * 60_000);
    if (i < FEATURED_MEMBERS.length) {
      const featured = FEATURED_MEMBERS[i];
      const { type } = pickWeighted(TX_TYPES);
      rows.push({
        _id: `${at.getTime()}-feat-${i}`,
        userId: featured.userId,
        name: featured.name,
        country: featured.country,
        type,
        amount: randomAmount(10, 5000),
        status: 'Success',
        createdAt: at.toISOString(),
      });
    } else {
      rows.push(createFakeTx(at));
    }
  }
  return rows.reverse();
}

/** Same for all members on a given UTC day; random within $30,000–$50,000 */
function todayTotalForDate(date = new Date()) {
  const key = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  const min = 30000;
  const max = 50000;
  return min + (hash % (max - min + 1));
}

export default function LiveFeed() {
  const [rows, setRows] = useState(() => seedFeed(10));
  const [grandTotal, setGrandTotal] = useState(() => randInt(180000, 420000));
  const [todayTotal, setTodayTotal] = useState(() => todayTotalForDate());

  useEffect(() => {
    const t = setInterval(() => {
      const row = createFakeTx(new Date());
      setRows((prev) => [row, ...prev].slice(0, MAX_ROWS));
      setTodayTotal(todayTotalForDate());
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
          <strong>${Number(todayTotal).toLocaleString()}</strong>
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
