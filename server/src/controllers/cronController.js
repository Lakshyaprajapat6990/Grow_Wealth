const { runDailyRoi } = require('../services/roiService');

function isAuthorizedCron(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Allow in local/dev without secret; require on Vercel production
    return !process.env.VERCEL || process.env.NODE_ENV !== 'production';
  }
  const auth = req.headers.authorization || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const queryKey = req.query.key || req.headers['x-cron-secret'];
  return bearer === secret || queryKey === secret;
}

/** Vercel Cron / external scheduler hits this once per day */
async function dailyRoiCron(req, res) {
  if (!isAuthorizedCron(req)) {
    return res.status(401).json({ success: false, message: 'Unauthorized cron' });
  }

  try {
    const result = await runDailyRoi({ createdBy: 'cron' });
    return res.json(result);
  } catch (err) {
    console.error('[daily-roi]', err);
    return res.status(500).json({ success: false, message: err.message || 'Daily ROI failed' });
  }
}

/** Admin can trigger the same job manually */
async function runDailyRoiAdmin(req, res) {
  try {
    const result = await runDailyRoi({ createdBy: req.user.userId });
    return res.json(result);
  } catch (err) {
    console.error('[daily-roi-admin]', err);
    return res.status(500).json({ success: false, message: err.message || 'Daily ROI failed' });
  }
}

module.exports = { dailyRoiCron, runDailyRoiAdmin };
