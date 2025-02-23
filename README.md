
# yuniver-CRUD

## 專案介紹
**yuniver-CRUD** 是一個完整的全端 (full-stack) CRUD 網頁專案，提供用戶註冊登入、專案管理、檔案上傳與 PDF 生成等功能。此專案的目標在於展示如何使用現代網路技術實作常見的 **建立、讀取、更新、刪除**（Create, Read, Update, Delete）操作。透過 yuniver-CRUD，用戶可以建立專案並在其中管理頁面、筆記、流程圖與檔案，甚至生成專案報價單 PDF 檔案，作為開發人員學習或擴充功能的基礎範例。

## 安裝與執行方式

1. **環境要求**  
   請先安裝 [Node.js](https://nodejs.org/)（建議版本 14 以上）與 [MongoDB](https://www.mongodb.com/)。本專案需要連接 MongoDB 資料庫來儲存資料。

2. **下載原始碼**  
   使用 Git 下載此專案：
   ```bash
   git clone https://github.com/yuniverses/yuniver-CRUD.git
   cd yuniver-CRUD
   ```

3. **後端安裝與設定**  
   - 進入 `server` 資料夾並安裝相依套件：
     ```bash
     cd server
     npm install
     ```
   - 在 `server` 目錄下建立 `.env` 檔案，設定以下內容（請根據實際環境修改）：
     - `MONGO_URI`：MongoDB 連接字串（例如：`mongodb://localhost:27017/yuniverCrud`）。
     - `JWT_SECRET`：JWT 簽發所需的密鑰字串，用於加密與驗證。
     - （可選）`PORT`：後端服務埠號（預設 5000）。

4. **前端安裝**  
   - 開啟另一個終端，進入 `client` 資料夾並安裝前端相依套件：
     ```bash
     cd client
     npm install
     ```

5. **啟動後端伺服器**  
   確保 MongoDB 資料庫已啟動，然後在 `server` 資料夾中執行：
   ```bash
   node index.js
   ```
   若使用開發模式，可考慮使用 `nodemon`：
   ```bash
   nodemon index.js
   ```
   後端預設於 [http://localhost:5000](http://localhost:5000) 運行。

6. **啟動前端開發伺服器**  
   在 `client` 資料夾中執行：
   ```bash
   npm start
   ```
   前端預設於 [http://localhost:3000](http://localhost:3000) 運行。該單頁應用 (SPA) 會與後端 API 通訊。

7. **測試與使用**  
   - 首次使用時，請先進行註冊，建立新帳號。  
   - 登入後可建立專案、添加頁面、上傳檔案、編輯流程圖，並生成 PDF 報價單。  
   - 上傳的檔案將存放在 `server/uploads` 資料夾，請確保該資料夾存在或已設定適當的存取權限。

## 主要功能介紹

- **用戶認證**  
  - 註冊與登入功能：  
    - `POST /api/auth/register`：用戶註冊（需提供名稱、Email、密碼等）。  
    - `POST /api/auth/login`：用戶登入，成功後會回傳 JWT 供後續驗證使用。

- **專案管理**  
  - 用戶可建立新專案，並透過下列 API 進行 CRUD 操作：  
    - `GET /api/projects`：取得所有專案列表。  
    - `POST /api/projects`：建立新專案。  
    - `GET /api/projects/:id`：取得指定專案詳細資料。  
    - `PUT /api/projects/:id`：更新專案。  
    - `DELETE /api/projects/:id`：刪除專案。

- **筆記與討論**  
  - 為專案添加筆記與討論：  
    - `POST /api/projects/:id/notes`：新增專案筆記。  
    - `POST /api/projects/:id/messages`：新增討論訊息。

- **流程圖製作**  
  - 支援為專案建立流程圖：  
    - `GET /api/projects/:id/flowchart`：取得流程圖資料。  
    - `PUT /api/projects/:id/flowchart`：更新流程圖。

- **頁面管理**  
  - 在專案下管理多個頁面：  
    - `GET /api/pages/:projectId`：取得所有頁面。  
    - `POST /api/pages/:projectId`：建立新頁面。  
    - 提供與頁面相關的檔案上傳與管理接口。

- **檔案上傳與管理**  
  - 支援檔案上傳、重新命名、刪除與下載：  
    - `POST /api/files/upload`：檔案上傳。  
    - `GET /api/files/project/:projectId`：取得專案檔案列表。  
    - `PUT /api/files/rename/:fileId`：重新命名檔案。  
    - `DELETE /api/files/:fileId`：刪除檔案。  
    - `GET /api/files/download/:fileName`：檔案下載。

- **範本管理**  
  - 用於定義與管理可重用的內容範本：  
    - `GET /api/templates`：取得所有範本列表。  
    - `POST /api/templates`：新增範本。  
    - `PUT /api/templates/:id`：更新範本。  
    - `DELETE /api/templates/:id`：刪除範本。

- **PDF 報價單生成**  
  - 根據專案或範本資料生成 PDF 報價單：  
    - `POST /api/quotation`：提交資料生成 PDF 報價單，成功後可下載生成的 PDF 文件。

## API 端點說明
本專案採用 RESTful API 設計，以下為主要 API 端點：

### 身份驗證 (Auth)
- `POST /api/auth/register`：註冊新用戶。
- `POST /api/auth/login`：用戶登入，成功回傳 JWT。

### 用戶 (User)
- `GET /api/users`：取得用戶列表（視權限設定）。

### 專案 (Project)
- `GET /api/projects`：取得目前用戶的所有專案。
- `POST /api/projects`：建立新專案。
- `GET /api/projects/:id`：取得單一專案詳細資料。
- `PUT /api/projects/:id`：更新專案資料。
- `DELETE /api/projects/:id`：刪除專案。
- `POST /api/projects/:id/notes`：為專案新增筆記。
- `POST /api/projects/:id/messages`：在專案中新增討論訊息。
- `GET /api/projects/:id/flowchart`：取得專案流程圖。
- `PUT /api/projects/:id/flowchart`：更新專案流程圖。

### 頁面 (Page)
- `GET /api/pages/:projectId`：取得專案所有頁面。
- `POST /api/pages/:projectId`：建立新頁面。
- `GET /api/pages/files/:pageId`：取得特定頁面的檔案列表。
- `POST /api/pages/files/:pageId`：上傳檔案到特定頁面。

### 檔案 (File)
- `POST /api/files/upload`：全域檔案上傳。
- `GET /api/files/project/:projectId`：取得專案檔案清單。
- `PUT /api/files/rename/:fileId`：重新命名檔案。
- `DELETE /api/files/:fileId`：刪除檔案。
- `GET /api/files/download/:fileName`：下載檔案。

### 範本 (Template)
- `GET /api/templates`：取得範本列表。
- `GET /api/templates/:id`：取得單一範本詳細資料。
- `POST /api/templates`：新增範本。
- `PUT /api/templates/:id`：更新範本。
- `DELETE /api/templates/:id`：刪除範本。

### 報價單 (Quotation)
- `POST /api/quotation`：生成 PDF 報價單，返回 PDF 檔案或下載連結。

*所有受保護的 API 端點需在 HTTP 標頭中附帶 `Authorization: Bearer <token>` 進行身份驗證。*

## 技術棧
- **前端**  
  - **React**：建立單頁應用 (SPA) 與使用者互動。  
  - **React Router DOM**：管理前端路由。  
  - **Axios**：與後端 API 進行 AJAX 請求。  
  - **React Flow**：用於流程圖的繪製與互動。

- **後端**  
  - **Node.js** 與 **Express**：實作 RESTful API。  
  - **MongoDB** 與 **Mongoose**：儲存資料與資料庫操作。  
  - **dotenv**：管理環境變數。  
  - **CORS**：處理跨域請求。

- **其他工具與套件**  
  - **JSON Web Token (JWT)**：用於用戶驗證與授權。  
  - **bcrypt**：密碼雜湊處理。  
  - **Multer**：檔案上傳管理。  
  - **PDFKit**：動態生成 PDF 文件。  
  - **Moment.js**：日期與時間格式化處理。

