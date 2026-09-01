const express = require('express');
const { liveDeposits, globalCommunity } = require('../controllers/feedController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/deposits/live-feed', protect, liveDeposits);
router.get('/global-community', protect, globalCommunity);

module.exports = router;
