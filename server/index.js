// index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const fileRoutes = require("./routes/fileRoutes");
const quoteRoutes = require("./routes/quoteRoutes");
const userRoutes = require("./routes/userRoutes"); // 新增這行
const templateRoutes = require("./routes/templateRoutes");
const pageRoutes = require("./routes/pageRoutes");

const app = express();

// 連線 MongoDB
connectDB();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads")); // 靜態提供上傳檔案

// 路由
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/quotation", quoteRoutes);
app.use("/api/users", userRoutes); // 新增這行
app.use("/api/templates", templateRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/projects", projectRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
