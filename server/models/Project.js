// models/Project.js
const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  content: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const messageSchema = new mongoose.Schema({
  message: String,
  sender: {
    type: String,
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // 添加附件支援
  attachments: [{
    filename: String,
    originalname: String,
    path: String,
    mimetype: String,
    size: Number,
    url: String,
    isDiscordAttachment: {
      type: Boolean,
      default: false
    }
  }],
  // 添加已讀狀態追蹤
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
});

const taskSchema = new mongoose.Schema({
  name: String, // 例如：網站框架設計
  status: String, // 例如：pending, in-progress, done
  order: Number, // 用於表示階段順序
});

const projectSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  projectName: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  period: {
    startDate: Date,
    endDate: Date,
  },
  // Discord相關欄位
  discordChannelId: {
    type: String,
    default: null
  },
  // 新增存取設定，access 可為 "edit" 或 "view"
  accessControl: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      access: { type: String, enum: ["edit", "view"], required: true },
    },
  ],
  teamMembers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  notes: [noteSchema], // 備註貼紙
  messages: [messageSchema], // 溝通記錄
  tasks: [taskSchema], // 進度追蹤
  createdAt: {
    type: Date,
    default: Date.now,
  },
  flowChart: {
    type: Array,
    default: [], // 儲存流程圖 JSON 資料
  },
});

module.exports = mongoose.model("Project", projectSchema);
