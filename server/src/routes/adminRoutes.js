const express = require('express');
const {
  dashboard,
  creditRoi,
  creditIncome,
  listWithdrawals,
  approveWithdrawal,
  listUsers,
  listPendingDeposits,
  approveDeposit,
  rejectDeposit,
  adjustFund,
} = require('../controllers/adminController');
const { adminList, adminReply } = require('../controllers/supportController');
const { adminCreate } = require('../controllers/notificationController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, adminOnly);
router.get('/dashboard', dashboard);
router.get('/users', listUsers);
router.post('/roi/credit', creditRoi);
router.post('/income/credit', creditIncome);
router.get('/withdrawals', listWithdrawals);
router.post('/withdrawals/:id/approve', approveWithdrawal);
router.get('/deposits/pending', listPendingDeposits);
router.post('/deposits/:id/approve', approveDeposit);
router.post('/deposits/:id/reject', rejectDeposit);
router.post('/fund/adjust', adjustFund);
router.get('/support', adminList);
router.post('/support/:id/reply', adminReply);
router.post('/notifications', adminCreate);

module.exports = router;
