// routes/projectRoutes.js
const express = require("express");
const router = express.Router();
const { auth, checkRole } = require("../middlewares/authMiddleware");

const {
  getAllProjects,
  createProject,
  getProjectDetails,
  updateProject,
  deleteProject, // 確保有 import
  addNote,
  deleteNote,
  addMessage,
  getFlowChart,
  updateFlowChart,
  updateProjectSettings,
  markMessagesAsRead,
  getUnreadMessageCount,
} = require("../controllers/projectController");

router.get(
  "/",
  auth,
  checkRole(["god", "admin", "employee", "customer"]),
  getAllProjects
);
router.post("/", auth, checkRole(["god", "admin"]), createProject);
router.get(
  "/:id",
  auth,
  checkRole(["god", "admin", "employee", "customer"]),
  getProjectDetails
);
router.put("/:id", auth, checkRole(["god", "admin"]), updateProject);
router.post("/:id/notes", auth, addNote);
router.delete("/:id/notes/:noteId", auth, checkRole(["god", "admin"]), deleteNote);
router.delete("/:id", auth, checkRole(["god", "admin"]), deleteProject);
// 引入multer用於處理檔案上傳
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 檢查上傳目錄是否存在
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 配置multer儲存
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// 新增訊息路由，支援多檔案上傳
router.post(
  "/:id/messages",
  auth,
  checkRole(["god", "admin", "employee", "customer"]),
  upload.array("attachments", 10), // 最多允許10個檔案
  addMessage
);

// 新增取得與更新流程圖的路由
router.get(
  "/:id/flowchart",
  auth,
  checkRole(["god", "admin", "employee", "customer"]),
  getFlowChart
);
router.put(
  "/:id/flowchart",
  auth,
  checkRole(["god", "admin", "employee"]),
  updateFlowChart
);
router.put(
  "/:id/settings",
  auth,
  checkRole(["god", "admin"]),
  updateProjectSettings
);

// 溝通訊息已讀狀態路由
router.post(
  "/:id/messages/read",
  auth,
  checkRole(["god", "admin", "employee", "customer"]),
  markMessagesAsRead
);
router.get(
  "/:id/messages/unread",
  auth,
  checkRole(["god", "admin", "employee", "customer"]),
  getUnreadMessageCount
);

module.exports = router;
