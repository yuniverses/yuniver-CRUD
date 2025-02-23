// routes/quoteRoutes.js
const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/authMiddleware"); // 確保是正確的路徑
const { generateQuotation } = require("../controllers/quoteController");

router.post("/", auth, generateQuotation);

module.exports = router;
