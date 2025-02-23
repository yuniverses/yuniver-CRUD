// server/controllers/templateController.js
const FlowChartTemplate = require('../models/FlowChartTemplate');

exports.getTemplates = async (req, res) => {
  try {
    const templates = await FlowChartTemplate.find({});
    res.json(templates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to get templates' });
  }
};

exports.getTemplate = async (req, res) => {
  try {
    const template = await FlowChartTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json(template);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to get template' });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const { name, description, flowChart } = req.body;
    const template = new FlowChartTemplate({
      name,
      description,
      flowChart,
      createdBy: req.userId // 確保驗證 middleware 設置了 req.userId
    });
    await template.save();
    res.status(201).json(template);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create template' });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const { name, description, flowChart } = req.body;
    const template = await FlowChartTemplate.findByIdAndUpdate(
      req.params.id,
      { name, description, flowChart },
      { new: true }
    );
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json(template);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update template' });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const template = await FlowChartTemplate.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete template' });
  }
};
