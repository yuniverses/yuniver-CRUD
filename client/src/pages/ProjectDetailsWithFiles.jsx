// client/src/pages/ProjectDetailsWithFiles.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../css/main.css";
import ReactDOM from "react-dom";

import { getProjectDetails, addNote, addMessage } from "../api/project";
import { getPages, createPage, getPageFiles, renamePage, deletePage } from "../api/page";
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

// ReactQuill toolbar configuration
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
  "header", "bold", "italic", "underline", "strike", "size",
  "link", "image", "video", "list", "bullet",
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
  const [docContent, setDocContent] = useState("");
  const [activeTab, setActiveTab] = useState("files"); // Add tabs for navigation

  // Get and decode JWT token role information
  const getRole = () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.role || null;
      } catch (err) {
        console.error("Token decoding error:", err);
        return null;
      }
    }
    return null;
  };

  // Simple permission check function
  const hasAccess = (role, allowedRoles) => {
    return allowedRoles.includes(role);
  };

  const role = getRole();

  useEffect(() => {
    loadProject();
    loadPages();
  }, [id]);

  // Update hover state for each file
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

  // Load files for a specific page
  const loadFiles = async (pageId) => {
    try {
      const data = await getPageFiles(pageId, token);
      const filesWithHoverState = data.map((file) => ({
        ...file,
        isHovered: false,
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

  // Load content when a text file is selected
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
    const pageName = prompt("Enter page name:", "New Page");
    if (!pageName) return;
    try {
      const newPage = await createPage(id, { name: pageName }, token);
      setPages((prev) => [...prev, newPage]);
      setSelectedPage(newPage);
    } catch (err) {
      console.error(err);
    }
  };

  // Create a text document
  const handleCreateDocument = async () => {
    if (!selectedPage) return;
    const docName = prompt("Enter document name:", "New Document.txt");
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
      if (selectedFile && selectedFile._id === fileId) {
        setSelectedFile(null);
      }
    } catch (err) {
      console.error(err);
      alert("File deletion failed");
    }
  };

  const handleRenameFile = async (fileId) => {
    const newName = prompt("Enter new file name:");
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

  // Update document content
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
      alert("Note added");
      setNoteContent("");
      loadProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMessage = async () => {
    try {
      await addMessage(id, messageContent, token);
      alert("Message added");
      setMessageContent("");
      loadProject();
    } catch (err) {
      console.error(err);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  };

  if (!project)
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading project...</p>
      </div>
    );

  return (
    <div className="yuniver-container">
      {/* Header */}
      <header className="yuniver-header">
        <div className="yuniver-logo">
          <h1>YUNIVER <span className="registered-mark">®</span></h1>
          <p className="subtitle">案件進度及檔案系統</p>
        </div>
        <nav className="main-nav">
          <a href="/" className={activeTab === "main" ? "active" : ""} onClick={() => setActiveTab("main")}>
            主頁
          </a>
          <a href="/mail" className={activeTab === "mail" ? "active" : ""} onClick={() => setActiveTab("mail")}>
            mail
          </a>
          <a href="/logout" className="logout-btn">登出</a>
        </nav>
      </header>

      <div className="yuniver-content">
        {/* Left sidebar */}
        <div className="yuniver-sidebar">
          <div className="project-info">
            <div className="info-section">
              <h4>For：</h4>
              <p className="info-value">{project.clientName || "Eric"}</p>
            </div>
            
            <div className="info-section">
              <h4>Subject：</h4>
              <p className="info-value">{project.projectName || "Eric portfolio"}</p>
            </div>
            
            <div className="info-section">
              <h4>Date：</h4>
              <p className="info-value">
                {formatDate(project.period?.startDate)} - {formatDate(project.period?.endDate)}
              </p>
            </div>
            
            <div className="info-section">
              <h4>專案負責人：</h4>
              <p className="info-value">{project.owner?.username || "shiro"}</p>
            </div>

            <div className="section-divider"></div>

            <div className="project-activities">
              <h3 className="section-title">案件進行中的項目</h3>
              {project.flowChart && 
               project.flowChart.filter(node => node.type === "task" && node.status === "進行中").length > 0 ? (
                <ul className="activity-list">
                  {project.flowChart
                    .filter(node => node.type === "task" && node.status === "進行中")
                    .map(task => (
                      <li key={task.id} className="activity-item">
                        <button onClick={() => navigate(`/flowchart-editor/${id}`)}>
                          {task.label || "Unnamed Task"}
                        </button>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="no-items">無進行中的項目</p>
              )}
            </div>
          </div>

          <div className="section-divider"></div>

          <div className="pages-section">
            <h3 className="section-title">Pages</h3>
            <ul className="page-list">
              {pages.map((page) => (
                <li 
                  key={page._id || page.id} 
                  className={`page-item ${selectedPage && (selectedPage._id || selectedPage.id) === (page._id || page.id) ? 'active' : ''}`}
                >
                  <span 
                    className="page-name" 
                    onClick={() => setSelectedPage(page)}
                  >
                    {page.name}
                  </span>
                  {hasAccess(role, ["god", "admin", "employee"]) && (
                    <div className="page-actions">
                      <button
                        className="action-btn rename-btn"
                        onClick={async () => {
                          const newName = prompt("請輸入新的頁面名稱：", page.name);
                          if (newName && newName !== page.name) {
                            try {
                              await renamePage(page._id || page.id, newName, token);
                              loadPages();
                            } catch (err) {
                              console.error(err);
                              alert("頁面重新命名失敗");
                            }
                          }
                        }}
                      >
                        Rename
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={async () => {
                          if (window.confirm("確定刪除此頁面嗎？")) {
                            try {
                              await deletePage(page._id || page.id, token);
                              setPages(pages.filter(p => (p._id || p.id) !== (page._id || page.id)));
                              if (selectedPage && (selectedPage._id || selectedPage.id) === (page._id || page.id)) {
                                setSelectedPage(pages[0] || null);
                              }
                              loadPages();
                            } catch (err) {
                              console.error(err);
                              alert("刪除頁面失敗");
                            }
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {hasAccess(role, ["god", "admin", "employee"]) && (
              <button className="add-btn" onClick={handleCreatePage}>
                + 新增頁面
              </button>
            )}
          </div>

          <div className="sidebar-actions">
            <button 
              className="action-link" 
              onClick={() => navigate(`/flowchart-editor/${id}`)}
            >
              案件流程圖
            </button>
            {hasAccess(role, ["god", "admin", "employee"]) && (
              <button
                className="action-link"
                onClick={() => navigate(`/project-settings/${id}`)}
              >
                案件資訊設定
              </button>
            )}
          </div>
        </div>

        {/* Middle: File list */}
        <div className="files-column">
          <h2 className="section-header">檔案列表</h2>
          {selectedPage ? (
            <div className="files-container">
              <ul className="file-list">
                {files.map((file) => (
                  <li
                    key={file._id || file.filename}
                    className={`file-item ${selectedFile && selectedFile._id === file._id ? 'active' : ''}`}
                    onMouseEnter={() => handleMouseEnter(file._id)}
                    onMouseLeave={() => handleMouseLeave(file._id)}
                  >
                    <div 
                      className="file-name"
                      onClick={() => setSelectedFile(file)}
                    >
                      {file.originalname || file.filename}
                    </div>
                    {file.isHovered && (
                      <div className="file-actions">
                        {hasAccess(role, ["god", "admin", "employee"]) && (
                          <button
                            className="file-action-btn"
                            onClick={() => handleRenameFile(file._id || file.id)}
                          >
                            Rename
                          </button>
                        )}
                        {hasAccess(role, ["god", "admin", "employee"]) && (
                          <button 
                            className="file-action-btn"
                            onClick={() => handleDeleteFile(file._id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {hasAccess(role, ["god", "admin", "employee"]) && (
                <div className="file-upload-container">
                  <label className="file-upload-label">
                    上傳檔案
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="file-input"
                    />
                  </label>
                  <button
                    className="create-doc-btn"
                    onClick={handleCreateDocument}
                  >
                    新增文檔
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="no-selection-message">請選擇一個頁面</p>
          )}
        </div>

        {/* Right: File preview and editing */}
        <div className="preview-column">
          <h2 className="section-header">檔案預覽</h2>
          {selectedFile ? (
            <div className="preview-container">
              {selectedFile.mimetype === "text/plain" ||
              selectedFile.mimetype === "text/html" ? (
                <div className="document-editor">
                  <ReactQuill
                    value={docContent}
                    onChange={setDocContent}
                    modules={quillModules}
                    formats={quillFormats}
                    className="quill-editor"
                  />
                  <div className="editor-actions">
                    <button 
                      className="editor-btn download-btn"
                      onClick={() => handleFileDownload(selectedFile.filename)}
                    >
                      下載檔案
                    </button>
                    <button 
                      className="editor-btn save-btn"
                      onClick={handleUpdateDocument}
                    >
                      儲存變更
                    </button>
                  </div>
                </div>
              ) : selectedFile.mimetype === "application/pdf" ? (
                <div className="pdf-preview">
                  <iframe
                    src={`http://localhost:5001/uploads/${selectedFile.filename}`}
                    title="PDF Preview"
                    className="pdf-frame"
                  />
                  <button 
                    className="download-btn"
                    onClick={() => handleFileDownload(selectedFile.filename)}
                  >
                    下載檔案
                  </button>
                </div>
              ) : selectedFile.mimetype &&
                selectedFile.mimetype.startsWith("image/") ? (
                <div className="image-preview">
                  <img
                    src={`http://localhost:5001/uploads/${selectedFile.filename}`}
                    alt="File Preview"
                    className="preview-image"
                  />
                  <button 
                    className="download-btn"
                    onClick={() => handleFileDownload(selectedFile.filename)}
                  >
                    下載檔案
                  </button>
                </div>
              ) : selectedFile.mimetype &&
                selectedFile.mimetype.startsWith("audio/") ? (
                <div className="audio-preview">
                  <audio controls className="audio-player">
                    <source
                      src={`http://localhost:5001/uploads/${selectedFile.filename}`}
                      type={selectedFile.mimetype}
                    />
                    Your browser does not support the audio element.
                  </audio>
                  <button 
                    className="download-btn"
                    onClick={() => handleFileDownload(selectedFile.filename)}
                  >
                    下載檔案
                  </button>
                </div>
              ) : selectedFile.mimetype &&
                selectedFile.mimetype.startsWith("video/") ? (
                <div className="video-preview">
                  <video controls className="video-player">
                    <source
                      src={`http://localhost:5001/uploads/${selectedFile.filename}`}
                      type={selectedFile.mimetype}
                    />
                    Your browser does not support the video element.
                  </video>
                  <button 
                    className="download-btn"
                    onClick={() => handleFileDownload(selectedFile.filename)}
                  >
                    下載檔案
                  </button>
                </div>
              ) : (
                <div className="unsupported-file">
                  <p>無法預覽此檔案</p>
                  <button 
                    className="download-btn"
                    onClick={() => handleFileDownload(selectedFile.filename)}
                  >
                    下載檔案
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="no-file-selected">
              <p>請從檔案列表中選擇檔案以預覽</p>
            </div>
          )}
        </div>
      </div>

      {/* Notes and communication floating windows */}
      <div className="floating-panels">
        <div className={`notes-panel ${showNotes ? 'expanded' : 'collapsed'}`}>
          <button 
            className="panel-toggle"
            onClick={() => setShowNotes((prev) => !prev)}
          >
            備註 {showNotes ? "隱藏" : "顯示"}
          </button>
          {showNotes && (
            <div className="panel-content">
              <h3 className="panel-title">備註</h3>
              <ul className="notes-list">
                {project.notes?.map((note) => (
                  <li key={note._id} className="note-item">
                    <span className="note-content">{note.content}</span>
                    <span className="note-date">
                      {new Date(note.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="note-input-container">
                <input
                  className="note-input"
                  placeholder="輸入備註"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                />
                <button 
                  className="add-note-btn"
                  onClick={handleAddNote}
                >
                  新增備註
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className={`messages-panel ${showMessages ? 'expanded' : 'collapsed'}`}>
          <button 
            className="panel-toggle"
            onClick={() => setShowMessages((prev) => !prev)}
          >
            溝通 {showMessages ? "隱藏" : "顯示"}
          </button>
          {showMessages && (
            <div className="panel-content">
              <h3 className="panel-title">溝通記錄</h3>
              <ul className="messages-list">
                {project.messages?.map((msg) => (
                  <li key={msg._id} className="message-item">
                    <span className="message-content">{msg.message}</span>
                    <span className="message-date">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="message-input-container">
                <input
                  className="message-input"
                  placeholder="輸入訊息"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                />
                <button 
                  className="add-message-btn"
                  onClick={handleAddMessage}
                >
                  新增訊息
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailsWithFiles;