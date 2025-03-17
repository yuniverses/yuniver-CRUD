// server/models/Page.js
const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalname: { type: String, required: true },
  path: { type: String }, // 對於上傳的檔案會有值，線上文件則可為空
  mimetype: { type: String, required: true },
  size: Number,
  uploadedAt: { type: Date, default: Date.now },
  content: { type: String }, // 文字檔內容，若非文字檔可為 undefined
  isExternalLink: { type: Boolean, default: false }, // 標記是否為外部連結
  url: { type: String }, // 外部連結的URL
  description: { type: String } // 外部連結的描述
});

const pageSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  name: { type: String, required: true },
  files: [fileSchema],
  permissions: { type: String, default: "STAFF_ONLY" } // Add permissions field
});

module.exports = mongoose.model("Page", pageSchema);