// models/File.js
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  fileName: String,
  filePath: String,
  // 若要整合雲端，可儲存 Google Drive Link 或其他雲端路徑
  fileType: String,
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('File', fileSchema);
