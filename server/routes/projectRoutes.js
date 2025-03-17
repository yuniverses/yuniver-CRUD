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
router.post(
  "/:id/messages",
  auth,
  checkRole(["god", "admin", "employee", "customer"]),
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

module.exports = router;
