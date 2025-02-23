// routes/projectRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const {
  getAllProjects,
  createProject,
  getProjectDetails,
  updateProject,
  deleteProject, // 確保有 import
  addNote,
  addMessage,
  getFlowChart,
  updateFlowChart
} = require('../controllers/projectController');

router.get('/', auth, getAllProjects);
router.post('/', auth, createProject);
router.get('/:id', auth, getProjectDetails);
router.put('/:id', auth, updateProject);
router.post('/:id/notes', auth, addNote);
router.delete('/:id', auth, deleteProject);  // <<--- 重要: 刪除路由
router.post('/:id/messages', auth, addMessage);

// 新增取得與更新流程圖的路由
router.get('/:id/flowchart', auth, getFlowChart);
router.put('/:id/flowchart', auth, updateFlowChart);

module.exports = router;
