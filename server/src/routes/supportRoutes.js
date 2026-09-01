const express = require('express');
const { createTicket, myTickets } = require('../controllers/supportController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.post('/create', protect, createTicket);
router.get('/me', protect, myTickets);

module.exports = router;
