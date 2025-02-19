// routes/fileRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { uploadFile, getProjectFiles, downloadFile } = require('../controllers/fileController');

// 使用 Multer 上傳
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

router.post('/upload', auth, upload.single('file'), uploadFile);
router.get('/:projectId', auth, getProjectFiles);
router.get('/download/:fileId', auth, downloadFile);

module.exports = router;
