// server/models/FlowChartTemplate.js
const mongoose = require('mongoose');

const flowChartTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  flowChart: { type: Array, default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('FlowChartTemplate', flowChartTemplateSchema);
