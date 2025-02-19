// routes/quoteRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { generateQuotation } = require('../controllers/quoteController');

router.post('/', auth, generateQuotation);

module.exports = router;
