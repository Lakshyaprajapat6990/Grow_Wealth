const express = require('express');
const {
  getProfile,
  getDirectTeam,
  getAllTeam,
  getDashboardSummary,
  getMyRankStatus,
} = require('../controllers/userController');
const { deleteMyAccount } = require('../controllers/deleteAccountController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/dashboard/summary', protect, getDashboardSummary);
router.get('/rank-status', protect, getMyRankStatus);
router.delete('/account', protect, deleteMyAccount);
router.get('/direct-team/:userId', protect, getDirectTeam);
router.get('/all-team/:userId', protect, getAllTeam);
router.get('/:userId', protect, getProfile);

module.exports = router;
