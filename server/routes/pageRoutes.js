const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/authMiddleware"); // 確保是正確的路徑
const {
  getPages,
  createPage,
  getPageFiles,
  uploadFileToPage,
} = require("../controllers/pageController");

router.get("/:projectId", auth, getPages);
router.post("/:projectId", auth, createPage);
router.get("/files/:pageId", auth, getPageFiles);
router.post("/files/:pageId", auth, uploadFileToPage);

module.exports = router;
