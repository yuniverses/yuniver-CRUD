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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // 可紀錄發送人、對象等
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
