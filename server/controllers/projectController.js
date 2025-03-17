// controllers/projectController.js
const Project = require("../models/Project");

// 取得所有專案清單
exports.getAllProjects = async (req, res) => {
  try {
    // 使用 populate('owner') 載入 User 的資料 (e.g. username)
    const projects = await Project.find()
      .populate("owner", "username") // 只載入 username 欄位
      .populate("teamMembers", "username");
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: "Failed to get projects" });
  }
};

// deleteProject
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Delete project error:", err);
    res.status(500).json({ message: "Failed to delete project" });
  }
};

// 新增專案
exports.createProject = async (req, res) => {
  try {
    const { clientName, projectName, period, owner, teamMembers, tasks } =
      req.body;
    const newProject = new Project({
      clientName,
      projectName,
      period,
      owner,
      teamMembers,
      tasks,
    });
    await newProject.save();
    
    // 為專案創建Discord頻道
    try {
      const discordBot = require('../utils/discordBot');
      console.log('準備為專案創建Discord頻道:', newProject.projectName);
      const channelId = await discordBot.createChannelForProject(newProject);
      
      if (channelId) {
        console.log('成功創建Discord頻道，ID:', channelId);
        // 更新專案的Discord頻道ID
        newProject.discordChannelId = channelId;
        await newProject.save();
        console.log('已將頻道ID儲存到專案');
      } else {
        console.error('無法創建Discord頻道');
      }
    } catch (discordError) {
      console.error('Discord頻道創建過程中發生錯誤:', discordError);
    }
    
    res.status(201).json({ message: "Project created", project: newProject });
  } catch (err) {
    console.error("Create project error:", err);
    res.status(500).json({ message: "Failed to create project" });
  }
};

// 取得單一專案詳細資訊
exports.getProjectDetails = async (req, res) => {
  try {
    // 查找專案
    const project = await Project.findById(req.params.id)
      .populate("owner", "username")
      .populate("teamMembers", "username");
    
    if (!project) return res.status(404).json({ message: "Project not found" });
    
    // 確保只返回屬於此專案的訊息
    if (project.messages && project.messages.length > 0) {
      project.messages = project.messages.filter(msg => 
        !msg.projectId || msg.projectId.toString() === project._id.toString()
      );
    }
    
    res.json(project);
  } catch (err) {
    console.error("Get project details error:", err);
    res.status(500).json({ message: "Failed to get project details" });
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
    if (!updatedProject)
      return res.status(404).json({ message: "Project not found" });
    res.json({ message: "Project updated", project: updatedProject });
  } catch (err) {
    res.status(500).json({ message: "Failed to update project" });
  }
};

// 新增備註(便條紙)
exports.addNote = async (req, res) => {
  try {
    const { content } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    project.notes.push({ content });
    await project.save();
    res.json({ message: "Note added", project });
  } catch (err) {
    res.status(500).json({ message: "Failed to add note" });
  }
};

// 刪除備註(便條紙)
exports.deleteNote = async (req, res) => {
  try {
    const { id, noteId } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // 找出並移除指定的備註
    const noteIndex = project.notes.findIndex(note => note._id.toString() === noteId);
    if (noteIndex === -1) return res.status(404).json({ message: "Note not found" });

    // 從 notes 數組中移除備註
    project.notes.splice(noteIndex, 1);
    await project.save();

    res.json({ message: "Note deleted successfully", project });
  } catch (err) {
    console.error("Delete note error:", err);
    res.status(500).json({ message: "Failed to delete note" });
  }
};

// 新增溝通訊息
exports.addMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    
    // 獲取發送者用戶名
    const sender = req.user ? req.user.username : 'Unknown User';
    
    // 添加訊息到專案，確保包含projectId
    project.messages.push({ message, sender, projectId: project._id });
    await project.save();
    
    // 如果有Discord頻道ID，將訊息同步至Discord
    if (project.discordChannelId) {
      try {
        console.log('專案有Discord頻道ID，嘗試同步訊息:', project.discordChannelId);
        const discordBot = require('../utils/discordBot');
        const sent = await discordBot.sendMessageToDiscord(project.discordChannelId, sender, message);
        console.log('Discord訊息同步結果:', sent ? '成功' : '失敗');
      } catch (discordError) {
        console.error('同步訊息到Discord時發生錯誤:', discordError);
      }
    } else {
      console.log('專案沒有Discord頻道ID，無法同步訊息');
    }
    
    res.json({ message: "Message added", project });
  } catch (err) {
    console.error("Add message error:", err);
    res.status(500).json({ message: "Failed to add message" });
  }
};

exports.getFlowChart = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project.flowChart);
  } catch (err) {
    console.error("Get flow chart error:", err);
    res.status(500).json({ message: "Failed to get flow chart" });
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
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ message: "Flow chart updated", flowChart: project.flowChart });
  } catch (err) {
    console.error("Update flow chart error:", err);
    res.status(500).json({ message: "Failed to update flow chart" });
  }
};

// controllers/projectController.js
exports.updateProjectSettings = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { accessControl } = req.body; // 預期格式： [{ user: userId, access: "edit" 或 "view" }, ...]
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // 僅允許 god 或 admin 修改存取設定
    if (!["god", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    project.accessControl = accessControl;
    await project.save();
    res.json(project);
  } catch (error) {
    console.error("Update project settings error:", error);
    res.status(500).json({ message: "Failed to update project settings" });
  }
};

