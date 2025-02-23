// controllers/projectController.js
const Project = require('../models/Project');

// 取得所有專案清單
exports.getAllProjects = async (req, res) => {
  try {
    // 使用 populate('owner') 載入 User 的資料 (e.g. username)
    const projects = await Project.find()
      .populate('owner', 'username')      // 只載入 username 欄位
      .populate('teamMembers', 'username'); 
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get projects' });
  }
};

// deleteProject
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ message: 'Failed to delete project' });
  }
};

// 新增專案
exports.createProject = async (req, res) => {
  try {
    const { clientName, projectName, period, owner, teamMembers, tasks } = req.body;
    const newProject = new Project({
      clientName,
      projectName,
      period,
      owner,
      teamMembers,
      tasks,
    });
    await newProject.save();
    res.status(201).json({ message: 'Project created', project: newProject });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create project' });
  }
};

// 取得單一專案詳細資訊
exports.getProjectDetails = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'username')
      .populate('teamMembers', 'username');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get project details' });
  }
};

// 更新專案（可更新備註、訊息、進度等等）
exports.updateProject = async (req, res) => {
  try {
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!updatedProject) return res.status(404).json({ message: 'Project not found' });
    res.json({ message: 'Project updated', project: updatedProject });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update project' });
  }
};

// 新增備註(便條紙)
exports.addNote = async (req, res) => {
  try {
    const { content } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    project.notes.push({ content });
    await project.save();
    res.json({ message: 'Note added', project });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add note' });
  }
};

// 新增溝通訊息
exports.addMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    project.messages.push({ message });
    await project.save();
    res.json({ message: 'Message added', project });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add message' });
  }
};

exports.getFlowChart = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project.flowChart);
  } catch (err) {
    console.error('Get flow chart error:', err);
    res.status(500).json({ message: 'Failed to get flow chart' });
  }
};

exports.updateFlowChart = async (req, res) => {
  try {
    const flowChart = req.body.flowChart; // 前端傳來的完整 JSON 陣列
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { flowChart },
      { new: true }
    );
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json({ message: 'Flow chart updated', flowChart: project.flowChart });
  } catch (err) {
    console.error('Update flow chart error:', err);
    res.status(500).json({ message: 'Failed to update flow chart' });
  }
};