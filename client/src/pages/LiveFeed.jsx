import { useEffect, useRef, useState } from 'react';
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
const MAX_ROWS = 40;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeFakeId() {
  let n = '';
  for (let i = 0; i < 7; i += 1) n += Math.floor(Math.random() * 10);
  return `GW${n}`;
}

/** Amount $500–$6000, often round-ish */
function randomAmount() {
  const raw = randInt(500, 6000);
  const modes = [raw, Math.round(raw / 10) * 10, Math.round(raw / 50) * 50, Math.round(raw / 100) * 100];
  return Number(Math.min(6000, Math.max(500, pick(modes))).toFixed(2));
}

function createFakeDeposit(now = new Date()) {
  const country = pick(COUNTRIES);
  const name = pick(NAME_POOLS[country]);
  return {
    _id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: makeFakeId(),
    name,
    country,
    amount: randomAmount(),
    status: 'Success',
    createdAt: now.toISOString(),
  };
}

function seedFeed(count = 12) {
  const rows = [];
  const now = Date.now();
  for (let i = 0; i < count; i += 1) {
    rows.push(createFakeDeposit(new Date(now - (count - i) * 10000)));
  }
  return rows.reverse();
}

export default function LiveFeed() {
  const [deposits, setDeposits] = useState(() => seedFeed(15));
  const [todayTotal, setTodayTotal] = useState(() => randInt(8000, 25000));
  const [grandTotal, setGrandTotal] = useState(() => randInt(180000, 420000));
  const tickRef = useRef(0);

  useEffect(() => {
    const t = setInterval(() => {
      const row = createFakeDeposit(new Date());
      tickRef.current += 1;
      setDeposits((prev) => [row, ...prev].slice(0, MAX_ROWS));
      setTodayTotal((v) => Number((v + row.amount).toFixed(0)));
      setGrandTotal((v) => Number((v + row.amount).toFixed(0)));
    }, 10000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <PageHeader title="System Live Feed" subtitle="Live platform deposit activity" />
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
          { key: 'amount', label: 'Amount', render: (r) => `$${Number(r.amount).toFixed(2)}` },
          { key: 'status', label: 'Status' },
          { key: 'date', label: 'Time', render: (r) => new Date(r.createdAt).toLocaleString() },
        ]}
        rows={deposits}
      />
    </div>
  );
}
