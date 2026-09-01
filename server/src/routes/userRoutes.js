const express = require('express');
const { getProfile, getDirectTeam, getAllTeam, getDashboardSummary } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/dashboard/summary', protect, getDashboardSummary);
router.get('/direct-team/:userId', protect, getDirectTeam);
router.get('/all-team/:userId', protect, getAllTeam);
router.get('/:userId', protect, getProfile);

module.exports = router;
