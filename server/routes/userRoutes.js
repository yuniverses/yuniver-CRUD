// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware'); // 如果需要驗證，請加上
const { getAllUsers } = require('../controllers/userController');

// 取得所有使用者（只回傳 _id 與 username）
router.get('/', auth, getAllUsers);

module.exports = router;
