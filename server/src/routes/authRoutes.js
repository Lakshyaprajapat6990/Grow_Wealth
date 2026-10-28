const express = require('express');
const {
  checkSponsor,
  register,
  registerStart,
  registerConfirmPayment,
  getPendingStatus,
  login,
  me,
  registerInfo,
  verifyPassword,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/register-info', registerInfo);
router.get('/check-sponsor/:sponsorId', checkSponsor);
router.post('/register', register);
router.post('/register-start', registerStart);
router.post('/register-confirm', registerConfirmPayment);
router.get('/register-pending/:pendingId', getPendingStatus);
router.post('/login', login);
router.get('/me', protect, me);
router.post('/verify-password', protect, verifyPassword);
router.post('/change-password', protect, changePassword);

module.exports = router;
