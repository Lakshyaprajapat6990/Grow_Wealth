const path = require('path');

if (!process.env.VERCEL) {
  require('dotenv').config({ path: path.join(__dirname, '../../.env') });
}

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes');
const adminRoutes = require('./routes/adminRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const supportRoutes = require('./routes/supportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const feedRoutes = require('./routes/feedRoutes');
const marketRoutes = require('./routes/marketRoutes');
const { dailyRoiCron } = require('./controllers/cronController');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

function isAllowedOrigin(origin) {
  if (!origin) return true;
  const allowed = [
    process.env.CLIENT_URL,
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
    process.env.VERCEL_BRANCH_URL && `https://${process.env.VERCEL_BRANCH_URL}`,
  ].filter(Boolean);
  if (allowed.includes(origin)) return true;
  if (/^http:\/\/localhost:\d+$/.test(origin)) return true;
  if (/^https:\/\/[\w-]+\.vercel\.app$/.test(origin)) return true;
  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) callback(null, true);
      else callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

async function ensureDb(_req, res, next) {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[DB]', err.message);
    res.status(500).json({ success: false, message: 'Database connection failed' });
  }
}

app.use(ensureDb);

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    app: process.env.APP_NAME || 'Grow Wealth',
    theme: 'dark-blue',
    time: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/market', marketRoutes);
app.get('/api/cron/daily-roi', dailyRoiCron);
app.post('/api/cron/daily-roi', dailyRoiCron);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
