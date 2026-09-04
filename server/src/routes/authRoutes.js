const express = require('express');
const { checkSponsor, register, login, me, registerInfo } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/register-info', registerInfo);
router.get('/check-sponsor/:sponsorId', checkSponsor);
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);

module.exports = router;
