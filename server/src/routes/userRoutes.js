const express = require('express');
const { getProfile, getDirectTeam, getAllTeam, getDashboardSummary } = require('../controllers/userController');
const { deleteMyAccount } = require('../controllers/deleteAccountController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/dashboard/summary', protect, getDashboardSummary);
router.delete('/account', protect, deleteMyAccount);
router.get('/direct-team/:userId', protect, getDirectTeam);
router.get('/all-team/:userId', protect, getAllTeam);
router.get('/:userId', protect, getProfile);

module.exports = router;
