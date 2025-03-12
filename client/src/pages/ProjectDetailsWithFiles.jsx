import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../css/main.css";
import ReactDOM from "react-dom";

import { getProjectDetails, addNote, addMessage } from "../api/project";
import { getPages, createPage, getPageFiles,renamePage,deletePage } from "../api/page";
import {
  uploadFile,
  downloadFile,
  deleteFile,
  renameFile,
  createDocument,
  updateDocument,
} from "../api/file";
if (!ReactDOM.findDOMNode) {
  ReactDOM.findDOMNode = (element) => element;
}

// 定義 ReactQuill 的工具列與格式設定
const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ size: ["small", false, "large", "huge"] }],
    ["link", "image", "video"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["clean"],
  ],
};

const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "size",
  "link",
  "image",
  "video",
  "list",
  "bullet",
];

function ProjectDetailsWithFiles() {
  const { id } = useParams();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [noteContent, setNoteContent] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  // 用於線上文件編輯的內容
  const [docContent, setDocContent] = useState("");


// 取得並解碼 JWT Token 中的角色資訊
const getRole = () => {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.role || null;
    } catch (err) {
      console.error("Token 解碼錯誤:", err);
      return null;
    }
  }
  return null;
};

// 簡單權限檢查函式，檢查當前角色是否在允許列表中
const hasAccess = (role, allowedRoles) => {
  return allowedRoles.includes(role);
};

const role = getRole();

  useEffect(() => {
    loadProject();
    loadPages();
  }, [id]);
  // 更新每個文件的hover狀態
  const handleMouseEnter = (fileId) => {
    setFiles((prevFiles) =>
      prevFiles.map((file) =>
        file._id === fileId ? { ...file, isHovered: true } : file
      )
    );
  };

  const handleMouseLeave = (fileId) => {
    setFiles((prevFiles) =>
      prevFiles.map((file) =>
        file._id === fileId ? { ...file, isHovered: false } : file
      )
    );
  };
  const loadProject = async () => {
    try {
      const data = await getProjectDetails(id, token);
      setProject(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPages = async () => {
    try {
      const data = await getPages(id, token);
      setPages(data);
      if (data.length > 0) {
        setSelectedPage(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 載入指定頁面的檔案列表，使用 GET /api/pages/files/:pageId
  const loadFiles = async (pageId) => {
    try {
      const data = await getPageFiles(pageId, token);
      // 為每個文件添加 isHovered 屬性
      const filesWithHoverState = data.map((file) => ({
        ...file,
        isHovered: false, // 初始化為 false
      }));
      setFiles(filesWithHoverState);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedPage) {
      loadFiles(selectedPage._id);
    }
  }, [selectedPage]);

  // 當選擇的檔案變更時，若為線上文字文件 (mimetype 為 text/plain 或 text/html)，則載入內容
  useEffect(() => {
    if (
      selectedFile &&
      (selectedFile.mimetype === "text/plain" ||
        selectedFile.mimetype === "text/html")
    ) {
      setDocContent(selectedFile.content || "");
    }
  }, [selectedFile]);

  const handleCreatePage = async () => {
    const pageName = prompt("請輸入頁面名稱：", "New Page");
    if (!pageName) return;
    try {
      const newPage = await createPage(id, { name: pageName }, token);
      setPages((prev) => [...prev, newPage]);
      setSelectedPage(newPage);
    } catch (err) {
      console.error(err);
    }
  };

  // 新增線上文檔（文字文件），mimetype 為 text/plain
  const handleCreateDocument = async () => {
    if (!selectedPage) return;
    const docName = prompt("請輸入文件名稱：", "New Document.txt");
    if (!docName) return;
    try {
      const newDoc = await createDocument(
        selectedPage._id,
        { name: docName, content: "" },
        token
      );
      setFiles((prev) => [...prev, newDoc]);
      setSelectedFile(newDoc);
    } catch (err) {
      console.error(err);
      alert("Document creation failed");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedPage) return;
    try {
      const uploadedFile = await uploadFile(selectedPage._id, file, token);
      setFiles((prev) => [...prev, uploadedFile]);
    } catch (err) {
      console.error(err);
      alert("File upload failed");
    }
  };

  const handleFileDownload = async (fileName) => {
    try {
      const res = await downloadFile(fileName, token);
      const blob = new Blob([res.data], { type: res.headers["content-type"] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      await deleteFile(fileId, token);
      setFiles((prev) => prev.filter((file) => file._id !== fileId));
    } catch (err) {
      console.error(err);
      alert("File deletion failed");
    }
  };

  const handleRenameFile = async (fileId) => {
    const newName = prompt("請輸入新檔案名稱：");
    if (!newName) return;
    try {
      const updatedFile = await renameFile(fileId, newName, token);
      setFiles((prev) =>
        prev.map((file) => (file._id === fileId ? updatedFile : file))
      );
    } catch (err) {
      console.error(err);
      alert("File rename failed");
    }
  };

  // 更新線上文件內容
  const handleUpdateDocument = async () => {
    if (!selectedFile) return;
    try {
      const updatedDoc = await updateDocument(
        selectedFile._id,
        docContent,
        token
      );
      setFiles((prev) =>
        prev.map((file) => (file._id === selectedFile._id ? updatedDoc : file))
      );
      setSelectedFile(updatedDoc);
      alert("Document updated successfully");
    } catch (err) {
      console.error(err);
      alert("Document update failed");
    }
  };

  const handleAddNote = async () => {
    try {
      await addNote(id, noteContent, token);
      alert("備註已新增");
      setNoteContent("");
      loadProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMessage = async () => {
    try {
      await addMessage(id, messageContent, token);
      alert("訊息已新增");
      setMessageContent("");
      loadProject();
    } catch (err) {
      console.error(err);
    }
  };

  if (!project)
    return <div style={{ padding: "20px" }}>Loading project...</div>;

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* 左側側邊欄 */}
      <div
        style={{
          width: "250px",
          borderRight: "1px solid #ccc",
          padding: "10px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h2>專案資訊</h2>
          <p>客戶名稱：{project.clientName}</p>
          <p>專案名稱：{project.projectName}</p>
          <p>負責人：{project.owner?.username || "N/A"}</p>
          <p>
            期間：
            {project.period?.startDate
              ? new Date(project.period.startDate).toLocaleDateString()
              : ""}{" "}
            ~{" "}
            {project.period?.endDate
              ? new Date(project.period.endDate).toLocaleDateString()
              : ""}
          </p>
        </div>
        <div>
          <h3>頁面列表</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
  {pages.map((page) => (
    <li key={page._id || page.id} style={{ marginBottom: "5px" }}>
      <span onClick={() => setSelectedPage(page)}>
        {page.name}
      </span>
      {hasAccess(role, ["god", "admin", "employee"]) && (
      <button
        onClick={async () => {
          const newName = prompt("請輸入新的頁面名稱：", page.name);
          if (newName && newName !== page.name) {
            try {
              const updated = await renamePage(page._id || page.id, newName, token);
              // 更新頁面列表，可重載或在 state 中直接更新
              // 例如：setPages(pages.map(p => p._id === updated.page._id ? updated.page : p));
              loadPages();
            } catch (err) {
              console.error(err);
              alert("頁面重新命名失敗");
            }
          }
        }}
        style={{ marginLeft: "10px" }}
      >
        Rename
      </button>
      )}
      {hasAccess(role, ["god", "admin", "employee"]) && (
      <button
        onClick={async () => {
          if (window.confirm("確定刪除此頁面嗎？")) {
            try {
              await deletePage(page._id || page.id, token);
              // 更新頁面列表
              setPages(pages.filter(p => (p._id || p.id) !== (page._id || page.id)));
              loadPages();
            } catch (err) {
              console.error(err);
              alert("刪除頁面失敗");
            }
          }
        }}
        style={{ marginLeft: "10px" }}
      >
        Delete
      </button>
      )}
    </li>
  ))}
</ul>
{hasAccess(role, ["god", "admin", "employee"]) && (
          <button onClick={handleCreatePage}>新增頁面</button>
        )}
        </div>
        <div>
          <button onClick={() => navigate(`/flowchart-editor/${id}`)}>
            案件流程圖
          </button>
          {hasAccess(role, ["god", "admin", "employee"]) && (

          <button
            onClick={() => navigate(`/project-settings/${id}`)}
            style={{ marginTop: "10px" }}
          >
            案件資訊設定
          </button>
        )}
        </div>
      </div>

      {/* 中間區域：檔案列表、上傳與新增文檔 */}
      <div
        style={{
          width: "300px",
          borderRight: "1px solid #ccc",
          padding: "10px",
        }}
      >
        <h2>檔案列表</h2>
        {selectedPage ? (
          <div>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {files.map((file) => (
                <li
                  key={file._id || file.filename}
                  style={{
                    cursor: "pointer",
                    marginBottom: "5px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    position: "relative",
                  }}
                  onMouseEnter={() => handleMouseEnter(file._id)} // 當鼠標進入
                  onMouseLeave={() => handleMouseLeave(file._id)} // 當鼠標離開
                >
                  <span onClick={() => setSelectedFile(file)}>
  {file.originalname || file.filename}
</span>
                  <div
                    className="file-actions"
                    style={{
                      display: file.isHovered ? "block" : "none", // 根據hover狀態顯示按鈕
                      position: "absolute",
                      right: "10px",
                    }}
                  >
                    {hasAccess(role, ["god", "admin", "employee"]) && (
                    <button
                      onClick={() => handleRenameFile(file._id || file.id)}
                      style={{ marginRight: "5px" }}
                    >
                      Rename
                    </button>
                    )}
                    {hasAccess(role, ["god", "admin", "employee"]) && (
                    <button onClick={() => handleDeleteFile(file._id)}>
                      Delete
                    </button>
                  )}
                  </div>
                </li>
              ))}
            </ul>
            {hasAccess(role, ["god", "admin", "employee"]) && (
              <label>
              上傳檔案:
              <input
                type="file"
                onChange={handleFileUpload}
                style={{ display: "block", marginTop: "5px" }}
              />
            </label>
          )}
            {hasAccess(role, ["god", "admin", "employee"]) && (

            <button
              onClick={handleCreateDocument}
              style={{ marginTop: "10px" }}
            >
              新增文檔
            </button>
                      )}
          </div>
        ) : (
          <p>請選擇一個頁面</p>
        )}
      </div>

      {/* 最右側：檔案預覽與線上編輯區 */}
      <div style={{ flex: 1, padding: "10px" }}>
        <h2>檔案預覽</h2>
        {selectedFile ? (
  selectedFile.mimetype === "text/plain" ||
  selectedFile.mimetype === "text/html" ? (
    <div>
      <ReactQuill
        value={docContent}
        onChange={setDocContent}
        modules={quillModules}
        formats={quillFormats}
        style={{ width: "100%", height: "80%" }}
      />
      <button onClick={() => handleFileDownload(selectedFile.filename)}>
        下載檔案
      </button>
      <button onClick={handleUpdateDocument} style={{ marginLeft: "10px" }}>
        儲存變更
      </button>
    </div>
  ) : selectedFile.mimetype === "application/pdf" ? (
    <div>
      <iframe
        src={`http://localhost:5001/uploads/${selectedFile.filename}`}
        title="PDF Preview"
        width="100%"
        height="80%"
        style={{ border: "none" }}
      />
      <button onClick={() => handleFileDownload(selectedFile.filename)}>
        下載檔案
      </button>
    </div>
  ) : selectedFile.mimetype &&
    selectedFile.mimetype.startsWith("image/") ? (
    <div>
      <img
        src={`http://localhost:5001/uploads/${selectedFile.filename}`}
        alt="File Preview"
        style={{
          width: "100%",
          height: "80%",
          objectFit: "contain",
        }}
      />
      <button onClick={() => handleFileDownload(selectedFile.filename)}>
        下載檔案
      </button>
    </div>
  ) : selectedFile.mimetype &&
    selectedFile.mimetype.startsWith("audio/") ? (
    <div>
      <audio controls style={{ width: "100%" }}>
        <source
          src={`http://localhost:5001/uploads/${selectedFile.filename}`}
          type={selectedFile.mimetype}
        />
        Your browser does not support the audio element.
      </audio>
      <button onClick={() => handleFileDownload(selectedFile.filename)}>
        下載檔案
      </button>
    </div>
  ) : selectedFile.mimetype &&
    selectedFile.mimetype.startsWith("video/") ? (
    <div>
      <video controls style={{ width: "100%" }}>
        <source
          src={`http://localhost:5001/uploads/${selectedFile.filename}`}
          type={selectedFile.mimetype}
        />
        Your browser does not support the video element.
      </video>
      <button onClick={() => handleFileDownload(selectedFile.filename)}>
        下載檔案
      </button>
    </div>
  ) : (
    <p>無法預覽此檔案</p>
  )
) : (
  <p>請從檔案列表中選擇檔案以預覽</p>
)}
      </div>

      {/* 備註與溝通視窗，使用懸浮呈現 */}
      <div style={{ position: "fixed", bottom: 20, right: 20, width: "300px" }}>
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            padding: "10px",
            marginBottom: "10px",
          }}
        >
          <button onClick={() => setShowNotes((prev) => !prev)}>
            備註 {showNotes ? "隱藏" : "顯示"}
          </button>
          {showNotes && (
            <div>
              <h3>備註</h3>
              <ul>
                {project.notes?.map((note) => (
                  <li key={note._id}>
                    {note.content}{" "}
                    <small>({new Date(note.createdAt).toLocaleString()})</small>
                  </li>
                ))}
              </ul>
              <input
                placeholder="輸入備註"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
              />
              <button onClick={handleAddNote}>新增備註</button>
            </div>
          )}
        </div>
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            padding: "10px",
          }}
        >
          <button onClick={() => setShowMessages((prev) => !prev)}>
            溝通 {showMessages ? "隱藏" : "顯示"}
          </button>
          {showMessages && (
            <div>
              <h3>溝通記錄</h3>
              <ul>
                {project.messages?.map((msg) => (
                  <li key={msg._id}>
                    {msg.message}{" "}
                    <small>({new Date(msg.createdAt).toLocaleString()})</small>
                  </li>
                ))}
              </ul>
              <input
                placeholder="輸入訊息"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
              />
              <button onClick={handleAddMessage}>新增訊息</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailsWithFiles;
