const express = require('express');
const {
  getProfile,
  getDirectTeam,
  getAllTeam,
  getDashboardSummary,
  getMyRankStatus,
  getMySalaryStatus,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/dashboard/summary', protect, getDashboardSummary);
router.get('/rank-status', protect, getMyRankStatus);
router.get('/salary-status', protect, getMySalaryStatus);
router.get('/direct-team/:userId', protect, getDirectTeam);
router.get('/all-team/:userId', protect, getAllTeam);
router.get('/:userId', protect, getProfile);

module.exports = router;
