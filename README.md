# 🌟 yuniver-CRUD

**yuniver-CRUD** 是一個基於 **MERN (MongoDB, Express.js, React, Node.js)** 的全端 CRUD 應用，提供 **用戶管理、專案管理、檔案管理、流程圖編輯** 與 **PDF 報價單生成** 等功能。適用於企業內部管理或 CRUD 教學範例。

📌 **核心功能**

- ✅ **用戶管理**：註冊、登入、權限管理 (JWT)
- ✅ **專案管理**：CRUD 操作、團隊協作
- ✅ **流程圖編輯**：使用 React Flow 設計流程
- ✅ **檔案管理**：檔案上傳、下載、刪除
- ✅ **報價單 PDF 生成**：動態生成專案報價單

---

## 🚀 **安裝與執行**

### 1️⃣ **環境需求**

請先安裝：

- **Node.js 14+**
- **MongoDB (本地/雲端)**

### 2️⃣ **下載專案**

```bash
git clone https://github.com/yuniverses/yuniver-CRUD.git
cd yuniver-CRUD
```

### 3️⃣ **設定環境變數**

在 **server** 目錄下建立 `.env` 檔案：

```env
MONGO_URI=mongodb://localhost:27017/yuniverCrud
JWT_SECRET=your_jwt_secret
PORT=5000
```

### 4️⃣ **安裝後端**

```bash
cd server
npm install
npm start  # 或使用 nodemon index.js
```

後端將運行於 `http://localhost:5000`

### 5️⃣ **安裝前端**

```bash
cd client
npm install
npm start
```

前端將運行於 `http://localhost:3000`

---

## 📂 **專案結構**

```
yuniver-CRUD
│── client/                 # 前端 (React)
│   ├── public/             # 靜態資源
│   ├── src/
│   │   ├── api/            # API 請求 (Axios)
│   │   ├── components/     # React 組件
│   │   ├── pages/          # 頁面
│   │   ├── assets/         # 靜態資源 (圖片、CSS)
│   │   ├── App.jsx         # 主要應用程式
│   │   ├── index.js        # 入口點
│   │   ├── routes.js       # 路由配置
│   │   ├── styles.css      # 全局樣式
│   ├── package.json
│   ├── .env.example
│── server/                 # 後端 (Node.js & Express)
│   ├── controllers/        # 控制器 (業務邏輯)
│   ├── models/             # MongoDB Schema
│   ├── routes/             # API 路由
│   ├── middlewares/        # 中間件 (驗證)
│   ├── utils/              # 工具 (PDF 生成、雜湊等)
│   ├── uploads/            # 檔案上傳存儲
│   ├── index.js            # 伺服器入口點
│   ├── package.json
│   ├── .env.example
│── README.md               # 說明文件
│── .gitignore              # 忽略文件
```

---

## 🛠️ **API 端點**

### 🔑 **身份驗證 (Auth)**

| 方法 | 端點                 | 描述                |
| ---- | -------------------- | ------------------- |
| POST | `/api/auth/register` | 用戶註冊            |
| POST | `/api/auth/login`    | 用戶登入 (回傳 JWT) |

### 👤 **用戶管理**

| 方法   | 端點             | 描述                  |
| ------ | ---------------- | --------------------- |
| GET    | `/api/users`     | 取得所有用戶 (需權限) |
| POST   | `/api/users`     | 建立新用戶            |
| PUT    | `/api/users/:id` | 更新用戶資料          |
| DELETE | `/api/users/:id` | 刪除用戶              |

### 📁 **檔案管理**

| 方法   | 端點                            | 描述               |
| ------ | ------------------------------- | ------------------ |
| POST   | `/api/files/upload`             | 檔案上傳           |
| GET    | `/api/files/project/:projectId` | 取得專案內所有檔案 |
| DELETE | `/api/files/:fileId`            | 刪除檔案           |
| PUT    | `/api/files/rename/:fileId`     | 重新命名檔案       |

### 📄 **專案管理**

| 方法   | 端點                | 描述         |
| ------ | ------------------- | ------------ |
| GET    | `/api/projects`     | 取得所有專案 |
| POST   | `/api/projects`     | 新增專案     |
| GET    | `/api/projects/:id` | 取得單一專案 |
| PUT    | `/api/projects/:id` | 更新專案     |
| DELETE | `/api/projects/:id` | 刪除專案     |

### 📝 **報價單 PDF 生成**

| 方法 | 端點             | 描述            |
| ---- | ---------------- | --------------- |
| POST | `/api/quotation` | 生成 PDF 報價單 |

---

## 🎨 **UI 頁面 (Screenshots)**

> 📌 **登入頁面**
>
> 📌 **專案管理**
>
> 📌 **檔案管理**
>
> 📌 **流程圖設計**
>
> 🔹 **(可加入圖片以提升可讀性)**

---

## 📌 **開發者指南**

📍 **開發環境**

```bash
# 啟動後端 (需 MongoDB)
cd server
npm run dev

# 啟動前端
cd client
npm start
```

📍 **專案分工**

- `client/` **(React SPA)**

  - `components/`：共享組件
  - `pages/`：路由對應的頁面
  - `api/`：API 請求 (Axios)
  - `routes.js`：路由定義

- `server/` **(Node.js & Express API)**
  - `models/`：Mongoose 資料模型
  - `controllers/`：業務邏輯
  - `routes/`：API 端點
  - `middlewares/`：JWT 驗證

---
````
