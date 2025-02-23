// server/routes/fileRoutes.js
const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/authMiddleware"); // 確保是正確的路徑
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Page = require("../models/Page");

// 檢查上傳目錄是否存在，這裡我們用 'uploads'
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// 上傳檔案：POST /api/files/upload
router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    const { pageId } = req.body;
    if (!pageId) {
      return res.status(400).json({ message: "Missing pageId" });
    }
    const page = await Page.findById(pageId);
    if (!page) return res.status(404).json({ message: "Page not found" });
    const fileData = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date(),
    };
    page.files.push(fileData); // Mongoose 將自動生成 _id 給 fileData
    await page.save();
    res.status(201).json(fileData);
  } catch (error) {
    console.error("Upload file error:", error);
    res.status(500).json({ message: "Failed to upload file" });
  }
});
// 取得指定專案的檔案列表：GET /api/files/project/:projectId
router.get("/project/:projectId", auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    // 取得此專案所有頁面的檔案，合併成一個列表
    const pages = await Page.find({ projectId });
    let files = [];
    pages.forEach((page) => {
      files = files.concat(page.files);
    });
    res.json(files);
  } catch (error) {
    console.error("Get project files error:", error);
    res.status(500).json({ message: "Failed to get project files" });
  }
});

// 刪除檔案：DELETE /api/files/:fileId
// 刪除檔案：DELETE /api/files/:fileId
router.delete("/:fileId", auth, async (req, res) => {
  try {
    const { fileId } = req.params;
    if (!fileId) {
      return res.status(400).json({ message: "Missing fileId" });
    }
    // 尋找包含該檔案的 Page
    const page = await Page.findOne({ "files._id": fileId });
    if (!page) return res.status(404).json({ message: "File not found" });

    // 取得子文件，檢查是否存在
    const fileSubdoc = page.files.id(fileId);
    if (!fileSubdoc) {
      return res.status(404).json({ message: "File subdocument not found" });
    }

    // 刪除檔案本體
    if (fs.existsSync(fileSubdoc.path)) {
      fs.unlink(fileSubdoc.path, (err) => {
        if (err) console.error("Failed to delete file from disk:", err);
      });
    }
    // 從 files 陣列中移除該子文件
    page.files.pull(fileId);
    await page.save();
    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete file error:", error);
    res.status(500).json({ message: "Failed to delete file" });
  }
});

// 重新命名檔案：PUT /api/files/rename/:fileId
router.put("/rename/:fileId", auth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { newName } = req.body;
    if (!newName) return res.status(400).json({ message: "Missing newName" });
    // 尋找包含該檔案的 Page
    const page = await Page.findOne({ "files._id": fileId });
    if (!page) return res.status(404).json({ message: "File not found" });
    const file = page.files.id(fileId);
    // 這裡只更新 originalname（你也可以選擇更新 filename，但注意檔案實體名稱）
    file.originalname = newName;
    await page.save();
    res.json(file);
  } catch (error) {
    console.error("Rename file error:", error);
    res.status(500).json({ message: "Failed to rename file" });
  }
});

// 下載檔案：GET /api/files/download/:fileName
router.get("/download/:fileName", auth, (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(uploadDir, fileName);
  if (fs.existsSync(filePath)) {
    res.download(filePath, fileName);
  } else {
    res.status(404).json({ message: "File not found" });
  }
});

// 新增線上文件：POST /api/files/document
router.post("/document", auth, async (req, res) => {
  try {
    const { pageId, name, content } = req.body;
    if (!pageId || !name) {
      return res.status(400).json({ message: "Missing pageId or name" });
    }
    const page = await Page.findById(pageId);
    if (!page) return res.status(404).json({ message: "Page not found" });
    const doc = {
      filename: name, // 使用名稱作為 filename
      originalname: name,
      mimetype: "text/plain",
      size: content ? content.length : 0,
      content: content || "",
    };
    page.files.push(doc);
    await page.save();
    // 回傳剛建立的文件，Mongoose 會自動產生 _id
    res.status(201).json(page.files[page.files.length - 1]);
  } catch (error) {
    console.error("Create document error:", error);
    res.status(500).json({ message: "Failed to create document" });
  }
});

// 更新線上文件內容：PUT /api/files/document/:fileId
router.put("/document/:fileId", auth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { content } = req.body;
    const page = await Page.findOne({ "files._id": fileId });
    if (!page) return res.status(404).json({ message: "Document not found" });
    const doc = page.files.id(fileId);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    doc.content = content;
    doc.size = content.length;
    await page.save();
    res.json(doc);
  } catch (error) {
    console.error("Update document error:", error);
    res.status(500).json({ message: "Failed to update document" });
  }
});

module.exports = router;
