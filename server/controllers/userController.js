// server/controllers/userController.js
const User = require('../models/User');

exports.getAllUsers = async (req, res) => {
  try {
    // 僅回傳 _id 與 username 欄位
    const users = await User.find({}, 'username');
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Failed to get users' });
  }
};
