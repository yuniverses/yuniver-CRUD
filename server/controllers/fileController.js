// controllers/fileController.js
const File = require('../models/File');
const path = require('path');
const fs = require('fs');

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

//  renameFile 
exports.renameFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const { newName } = req.body;
    if (!newName) {
      return res.status(400).json({ message: "請提供新檔案名稱" });
    }

    // 更新檔案名稱
    const updatedFile = await File.findByIdAndUpdate(
      fileId,
      { fileName: newName },
      { new: true }
    );

    if (!updatedFile) {
      return res.status(404).json({ message: "檔案未找到" });
    }
    
    res.json({ message: "檔案重新命名成功", file: updatedFile });
  } catch (err) {
    res.status(500).json({ message: "檔案重新命名失敗", error: err.message });
  }
};

// 新增外部連結
exports.addLink = async (req, res) => {
  try {
    const { pageId, name, url, description, isExternalLink } = req.body;
    
    // 建立新的檔案記錄，但設定為外部連結
    const newLink = new File({
      projectId: pageId,
      fileName: name,
      url: url,
      description: description || "",
      isExternalLink: true,
      uploadedAt: new Date()
    });
    
    await newLink.save();
    
    res.status(201).json(newLink);
  } catch (error) {
    console.error('Error adding external link:', error);
    res.status(500).json({ message: "Error adding external link", error: error.message });
  }
};

// 更新外部連結
exports.updateLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { name, url, description } = req.body;
    
    const updatedLink = await File.findByIdAndUpdate(
      linkId,
      { 
        fileName: name, 
        url: url, 
        description: description 
      },
      { new: true }
    );
    
    if (!updatedLink) {
      return res.status(404).json({ message: "Link not found" });
    }
    
    res.status(200).json(updatedLink);
  } catch (error) {
    console.error('Error updating external link:', error);
    res.status(500).json({ message: "Error updating external link", error: error.message });
  }
};
