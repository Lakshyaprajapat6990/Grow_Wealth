const express = require('express');
const {
  getWalletInfo,
  creditDeposit,
  activateJoining,
  requestWithdraw,
  walletHistory,
  getDepositAddress,
  getWithdrawals,
  transferFunds,
} = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/info', protect, getWalletInfo);
router.get('/history', protect, walletHistory);
router.get('/withdrawals', protect, getWithdrawals);
router.get('/deposit-address', protect, getDepositAddress);
router.post('/deposit', protect, creditDeposit);
router.post('/join', protect, activateJoining);
router.post('/withdraw', protect, requestWithdraw);
router.post('/transfer', protect, transferFunds);

module.exports = router;
