// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/authMiddleware"); // 確保是正確的路徑
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

router.get("/", auth, getUsers);
router.post("/", auth, createUser);
router.put("/:id", auth, updateUser);
router.delete("/:id", auth, deleteUser);

module.exports = router;
