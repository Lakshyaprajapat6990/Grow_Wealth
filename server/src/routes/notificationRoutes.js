const express = require('express');
const { myNotifications, markRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/me', protect, myNotifications);
router.post('/mark-read', protect, markRead);

module.exports = router;
