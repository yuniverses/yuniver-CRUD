// server/routes/pageRoutes.js
const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/authMiddleware"); // 確保是正確的路徑
const {
  getPages,
  createPage,
  getPageFiles,
  uploadFileToPage,
  deletePage,
  renamePage,
  updatePagePermissions, // Add this controller function
} = require("../controllers/pageController");

router.get("/:projectId", auth, getPages);
router.post("/:projectId", auth, createPage);
router.get("/files/:pageId", auth, getPageFiles);
router.post("/files/:pageId", auth, uploadFileToPage);
// 新增刪除頁面的路由
router.delete("/:pageId", auth, deletePage);
// 新增更新頁面權限的路由
router.put("/:pageId/permissions", auth, updatePagePermissions);
// 新增重新命名頁面的路由
router.put("/:pageId", auth, renamePage);

module.exports = router;