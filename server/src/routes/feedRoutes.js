const express = require('express');
const { liveDeposits, globalCommunity } = require('../controllers/feedController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();
/** Real deposit feed — admin only (members see simulated feed on client) */
router.get('/deposits/live-feed', protect, adminOnly, liveDeposits);
router.get('/global-community', protect, globalCommunity);

module.exports = router;
