const Page = require('../models/Page');
const multer  = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // 請確保 uploads 資料夾存在
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

exports.getPages = async (req, res) => {
  try {
    const pages = await Page.find({ projectId: req.params.projectId });
    res.json(pages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pages' });
  }
};

exports.createPage = async (req, res) => {
  try {
    const { name } = req.body;
    const page = new Page({
      projectId: req.params.projectId,
      name,
      files: []
    });
    await page.save();
    res.status(201).json(page);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create page' });
  }
};

exports.getPageFiles = async (req, res) => {
  try {
    const page = await Page.findById(req.params.pageId);
    if (!page) return res.status(404).json({ message: 'Page not found' });
    res.json(page.files);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get page files' });
  }
};

exports.uploadFileToPage = [
  upload.single('file'),
  async (req, res) => {
    try {
      const page = await Page.findById(req.params.pageId);
      if (!page) return res.status(404).json({ message: 'Page not found' });
      const fileData = {
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size,
      };
      page.files.push(fileData);
      await page.save();
      res.status(201).json(fileData);
    } catch (error) {
      res.status(500).json({ message: 'Failed to upload file' });
    }
  }
];

// 刪除頁面
exports.deletePage = async (req, res) => {
  try {
    const { pageId } = req.params;
    const page = await Page.findById(pageId);
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }
    await page.remove();
    res.json({ message: 'Page deleted successfully' });
  } catch (error) {
    console.error("Delete page error:", error);
    res.status(500).json({ message: 'Failed to delete page' });
  }
};

// 重新命名頁面
exports.renamePage = async (req, res) => {
  try {
    const { pageId } = req.params;
    const { newName } = req.body;
    if (!newName) {
      return res.status(400).json({ message: 'Missing new name' });
    }
    const page = await Page.findById(pageId);
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }
    page.name = newName;
    await page.save();
    res.json({ message: 'Page renamed successfully', page });
  } catch (error) {
    console.error("Rename page error:", error);
    res.status(500).json({ message: 'Failed to rename page' });
  }
};