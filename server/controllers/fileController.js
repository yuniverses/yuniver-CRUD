// controllers/fileController.js
const File = require('../models/File');
const path = require('path');

// 若採用本地上傳，使用 Multer 做檔案處理
exports.uploadFile = async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const newFile = new File({
      projectId,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileType: req.file.mimetype,
    });

    await newFile.save();
    res.json({ message: 'File uploaded successfully', file: newFile });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload file' });
  }
};

exports.getProjectFiles = async (req, res) => {
  try {
    const files = await File.find({ projectId: req.params.projectId });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get files' });
  }
};

// 若需要下載功能
exports.downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    res.download(path.resolve(file.filePath), file.fileName);
  } catch (err) {
    res.status(500).json({ message: 'Failed to download file' });
  }
};
