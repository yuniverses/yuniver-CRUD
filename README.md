# Yuniver CRUD API

Yuniver CRUD 是一個專案管理 API，提供 **使用者驗證、專案管理、檔案管理** 和 **流程圖範本管理** 功能。  
技術棧包括 **Node.js、Express、MongoDB**，並採用 **JWT 驗證** 機制。

## 📌 主要功能介紹

### 🔐 使用者驗證

- 註冊與登入，並使用 JWT 進行身份驗證

### 📂 專案管理

- 建立、更新、刪除專案
- 指派團隊成員，追蹤專案進度
- 新增備註、訊息與流程圖

### 📁 檔案管理

- 上傳、下載、刪除專案相關檔案

### 📄 報價單產生

- 生成 PDF 報價單，供客戶下載

### 📑 流程圖範本管理

- 存儲、檢視、更新及刪除流程圖範本

---

## ⚙️ 安裝與執行方式

### 1️⃣ 克隆專案

```sh
git clone https://github.com/yuniverses/yuniver-CRUD.git
cd yuniver-CRUD/server
```

### 2️⃣ 安裝相依套件

```sh
npm install
```

### 3️⃣ 設定環境變數

在 `server` 目錄下建立 `.env` 檔案，並填入以下內容：

```
MONGO_URI=你的MongoDB連線字串
JWT_SECRET=你的JWT密鑰
```

### 4️⃣ 啟動伺服器

```sh
node server.js
```

🚀 伺服器將會在 **http://localhost:3000** 運行。

---

## 📡 API 端點說明

### 🔐 使用者驗證

| 方法 | 端點                 | 功能                 |
| ---- | -------------------- | -------------------- |
| POST | `/api/auth/register` | 註冊新使用者         |
| POST | `/api/auth/login`    | 使用者登入並獲取 JWT |

### 📂 專案管理

| 方法   | 端點                          | 功能                 |
| ------ | ----------------------------- | -------------------- |
| GET    | `/api/projects`               | 取得所有專案         |
| POST   | `/api/projects`               | 新增專案             |
| GET    | `/api/projects/:id`           | 取得單一專案詳細資訊 |
| PUT    | `/api/projects/:id`           | 更新專案             |
| DELETE | `/api/projects/:id`           | 刪除專案             |
| POST   | `/api/projects/:id/notes`     | 新增備註             |
| POST   | `/api/projects/:id/messages`  | 新增溝通訊息         |
| GET    | `/api/projects/:id/flowchart` | 取得專案流程圖       |
| PUT    | `/api/projects/:id/flowchart` | 更新專案流程圖       |

### 📁 檔案管理

| 方法   | 端點                            | 功能               |
| ------ | ------------------------------- | ------------------ |
| POST   | `/api/files/upload`             | 上傳檔案           |
| GET    | `/api/files/project/:projectId` | 取得專案的所有檔案 |
| DELETE | `/api/files/:fileId`            | 刪除指定檔案       |
| GET    | `/api/files/download/:fileName` | 下載指定檔案       |

### 📄 報價單管理

| 方法 | 端點          | 功能           |
| ---- | ------------- | -------------- |
| POST | `/api/quotes` | 產生報價單 PDF |

### 📑 流程圖範本管理

| 方法   | 端點                 | 功能         |
| ------ | -------------------- | ------------ |
| GET    | `/api/templates`     | 取得所有範本 |
| GET    | `/api/templates/:id` | 取得單一範本 |
| POST   | `/api/templates`     | 建立新範本   |
| PUT    | `/api/templates/:id` | 更新範本     |
| DELETE | `/api/templates/:id` | 刪除範本     |

---

## 📁 Folder Structure（詳細）

```
yuniver-CRUD/
│── client/                     # (前端目錄，若適用)
│── server/                      # 伺服器端代碼
│   ├── config/                  # 設定檔案 (如資料庫連線)
│   │   ├── db.js                # 連接 MongoDB
│   │
│   ├── controllers/             # 控制器 (業務邏輯)
│   │   ├── authController.js    # 使用者驗證
│   │   ├── fileController.js    # 檔案管理
│   │   ├── pageController.js    # 頁面管理
│   │   ├── projectController.js # 專案管理
│   │   ├── quoteController.js   # 報價單處理
│   │   ├── templateController.js # 流程圖範本管理
│   │   ├── userController.js    # 使用者管理
│   │
│   ├── middlewares/             # 中介層 (如身份驗證)
│   │   ├── authMiddleware.js    # JWT 驗證
│   │
│   ├── models/                  # MongoDB 資料模型
│   │   ├── File.js              # 檔案模型
│   │   ├── FlowChartTemplate.js # 流程圖範本
│   │   ├── Page.js              # 頁面模型
│   │   ├── Project.js           # 專案模型
│   │   ├── User.js              # 使用者模型
│   │
│   ├── routes/                  # API 路由
│   │   ├── authRoutes.js        # 使用者驗證 API
│   │   ├── fileRoutes.js        # 檔案管理 API
│   │   ├── pageRoutes.js        # 頁面 API
│   │   ├── projectRoutes.js     # 專案 API
│   │   ├── quoteRoutes.js       # 報價單 API
│   │   ├── templateRoutes.js    # 流程圖範本 API
│   │
│   ├── uploads/                 # 上傳檔案存放資料夾
│   │
│   ├── utils/                   # 工具函式
│   │   ├── pdfGenerator.js      # 產生 PDF 報價單
│   │
│   ├── server.js                # 伺服器進入點
│
│── README.md                    # 專案說明文件
```

---
