// index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const fileRoutes = require("./routes/fileRoutes");
const quoteRoutes = require("./routes/quoteRoutes");
const userRoutes = require("./routes/userRoutes"); // 新增這行
const templateRoutes = require("./routes/templateRoutes");
const pageRoutes = require("./routes/pageRoutes");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // 允許所有來源，開發階段更容易調試
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["*"]
  },
  path: '/socket.io', // 明確指定默認路徑，確保與客戶端匹配
});

// 連線 MongoDB
connectDB();

app.use(cors({
  origin: "*", // 允許所有來源
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));
app.use(express.json());
app.use("/uploads", express.static("uploads")); // 靜態提供上傳檔案

// Socket.IO 連線處理
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  console.log("Connection details:", {
    id: socket.id,
    handshake: {
      address: socket.handshake.address,
      headers: socket.handshake.headers,
      url: socket.handshake.url,
      query: socket.handshake.query
    }
  });
  
  // 發送歡迎消息，確認連接正常
  socket.emit('welcome', { message: 'Successfully connected to server', socketId: socket.id });
  
  // 加入專案的通訊房間
  socket.on("join_project", (projectId) => {
    console.log(`User ${socket.id} joined project room: ${projectId}`);
    socket.join(projectId);
    
    // 確認已加入房間
    socket.emit('room_joined', { projectId, status: 'success' });
  });
  
  // 離開專案的通訊房間
  socket.on("leave_project", (projectId) => {
    console.log(`User ${socket.id} left project room: ${projectId}`);
    socket.leave(projectId);
    
    // 確認已離開房間
    socket.emit('room_left', { projectId, status: 'success' });
  });
  
  // 標記訊息已讀
  socket.on("mark_messages_read", (projectId) => {
    console.log(`User ${socket.id} marking messages as read in project: ${projectId}`);
    // 這個事件會透過API調用處理，這裡僅通知其他用戶
    socket.to(projectId).emit('messages_marked_read', { 
      projectId, 
      byUser: socket.id,
      timestamp: new Date()
    });
  });
  
  // 斷線處理
  socket.on("disconnect", (reason) => {
    console.log(`Client disconnected: ${socket.id}, Reason: ${reason}`);
  });
  
  // 錯誤處理
  socket.on("error", (error) => {
    console.error(`Socket ${socket.id} error:`, error);
  });
});

// 將Socket.IO實例添加到app對象，以便在其他模塊中使用
app.set("io", io);

// 將app和io設為全局可訪問，供Discord機器人等其他模塊使用
global.app = app;
global.io = io;

// 路由
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/quotation", quoteRoutes);
app.use("/api/users", userRoutes); // 新增這行
app.use("/api/templates", templateRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/projects", projectRoutes);

// 初始化Discord機器人 (在Express和Socket.IO設置完成後)
const discordBot = require("./utils/discordBot");
discordBot.initBot();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
