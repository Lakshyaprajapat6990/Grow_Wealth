const express = require('express');
const { getSymbols, getPrices } = require('../controllers/marketController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/symbols', protect, getSymbols);
router.get('/prices', protect, getPrices);

module.exports = router;
