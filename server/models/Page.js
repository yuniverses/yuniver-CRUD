// server/models/Page.js
const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  files: [{
    filename: String,
    originalname: String,
    path: String,
    mimetype: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('Page', pageSchema);
