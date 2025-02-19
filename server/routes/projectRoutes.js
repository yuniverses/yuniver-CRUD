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
} = require('../controllers/projectController');

router.get('/', auth, getAllProjects);
router.post('/', auth, createProject);
router.get('/:id', auth, getProjectDetails);
router.put('/:id', auth, updateProject);
router.post('/:id/notes', auth, addNote);
router.delete('/:id', auth, deleteProject);  // <<--- 重要: 刪除路由
router.post('/:id/messages', auth, addMessage);

module.exports = router;
