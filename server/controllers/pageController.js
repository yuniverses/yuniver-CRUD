//server/controllers/pageController.js

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
    // 使用 deleteOne 而不是已棄用的 remove 方法
    await Page.deleteOne({ _id: pageId });
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

// Update page permissions
exports.updatePagePermissions = async (req, res) => {
  try {
    const { pageId } = req.params;
    const { permissions } = req.body;
    const userRole = req.user.role;
    
    // Find the page
    const page = await Page.findById(pageId);
    
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }
    
    // Access control based on user role and requested permission
    if (userRole === "god") {
      // God can set any permission
    } else if (userRole === "admin") {
      // Admin can't set GOD_ONLY
      if (permissions === "GOD_ONLY") {
        return res.status(403).json({ message: "Unauthorized to set this permission level" });
      }
    } else if (userRole === "employee") {
      // Employee can only set STAFF_ONLY and ALL_STAFF_AND_CUSTOMER
      if (permissions !== "STAFF_ONLY" && permissions !== "ALL_STAFF_AND_CUSTOMER") {
        return res.status(403).json({ message: "Unauthorized to set this permission level" });
      }
    } else {
      // Other roles can't modify permissions
      return res.status(403).json({ message: "Unauthorized to modify permissions" });
    }
    
    // Update permissions
    page.permissions = permissions;
    await page.save();
    
    res.status(200).json(page);
  } catch (error) {
    console.error("Update permissions error:", error);
    res.status(500).json({ message: 'Failed to update page permissions' });
  }
};