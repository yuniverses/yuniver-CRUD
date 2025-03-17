import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../css/main.css";
import "../css/custom-communication.css";
import ReactDOM from "react-dom";

import { getProjectDetails, addNote, deleteNote, addMessage } from "../api/project";
import { getPages, createPage, getPageFiles, renamePage, deletePage, updatePagePermissions } from "../api/page";
import {
  uploadFile,
  downloadFile,
  deleteFile,
  renameFile,
  createDocument,
  updateDocument,
  addExternalLink,
  updateExternalLink,
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

// Define permission presets
const PERMISSION_PRESETS = {
  "GOD_ONLY": ["god"],
  "STAFF_ONLY": ["god", "admin", "employee"],
  "ALL_STAFF_AND_CUSTOMER": ["god", "admin", "employee", "customer"],
  "MANAGEMENT_AND_CUSTOMER": ["god", "admin", "customer"]
};

// Permission labels for display
const PERMISSION_LABELS = {
  "GOD_ONLY": "僅系統管理員",
  "STAFF_ONLY": "僅內部人員",
  "ALL_STAFF_AND_CUSTOMER": " ",
  "MANAGEMENT_AND_CUSTOMER": "管理層和客戶"
};

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
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [linkData, setLinkData] = useState({ url: "", name: "", description: "" });
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [communicationTab, setCommunicationTab] = useState('messages'); // 'messages' or 'notes'
  const [showStickyNotes, setShowStickyNotes] = useState(false);
  const [stickyNotes, setStickyNotes] = useState([]);
  const [selectedNoteColor, setSelectedNoteColor] = useState('yellow'); // 'yellow', 'green', 'blue', 'pink'
  const [docContent, setDocContent] = useState("");
  const [activeTab, setActiveTab] = useState("files");
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState("");
  const [showFlowchartModal, setShowFlowchartModal] = useState(false);

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

  const role = getRole();

  // Simple permission check function
  const hasAccess = (role, allowedRoles) => {
    return allowedRoles.includes(role);
  };
  
  // Function to check if user has permission to view a specific page
  const hasPageAccess = (page) => {
    if (!page || !page.permissions) return true; // Default: accessible if no permissions
    
    if (typeof page.permissions === 'string') {
      // When permissions is a string (preset key)
      return PERMISSION_PRESETS[page.permissions]?.includes(role) || false;
    } else if (Array.isArray(page.permissions)) {
      // When permissions is an array of roles
      return page.permissions.includes(role);
    }
    
    return false;
  };
  
  // Function to determine which permission options are available based on user's role
  const getAvailablePermissions = () => {
    if (role === "god") {
      return Object.keys(PERMISSION_PRESETS);
    } else if (role === "admin") {
      return ["STAFF_ONLY", "ALL_STAFF_AND_CUSTOMER", "MANAGEMENT_AND_CUSTOMER"];
    } else if (role === "employee") {
      return ["STAFF_ONLY", "ALL_STAFF_AND_CUSTOMER"];
    }
    
    return [];
  };

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
      // Select first accessible page
      if (data.length > 0) {
        const accessiblePage = data.find(page => hasPageAccess(page));
        if (accessiblePage) {
          setSelectedPage(accessiblePage);
        }
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
        selectedFile.mimetype === "text/html") && 
      !selectedFile.isExternalLink
    ) {
      setDocContent(selectedFile.content || "");
    }
  }, [selectedFile]);

  const handleCreatePage = async () => {
    const pageName = prompt("Enter page name:", "New Page");
    if (!pageName) return;
    
    try {
      // Create page with default permissions based on user role
      let defaultPermission = "STAFF_ONLY";
      if (role === "god") {
        defaultPermission = "GOD_ONLY";
      }
      
      const newPage = await createPage(
        id, 
        { 
          name: pageName,
          permissions: defaultPermission
        }, 
        token
      );
      
      setPages((prev) => [...prev, newPage]);
      setSelectedPage(newPage);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle page permission changes
  const handleUpdatePagePermissions = async (pageId, permission) => {
    try {
      await updatePagePermissions(pageId, { permissions: permission }, token);
      
      // Update local state
      setPages(prevPages => 
        prevPages.map(page => 
          page._id === pageId ? { ...page, permissions: permission } : page
        )
      );
      
      if (selectedPage && selectedPage._id === pageId) {
        setSelectedPage(prev => ({ ...prev, permissions: permission }));
      }
      
      setShowPermissionsModal(false);
    } catch (err) {
      console.error(err);
      alert("更新頁面權限失敗");
    }
  };

  // Open permissions modal for a page
  const openPermissionsModal = (page) => {
    setSelectedPage(page);
    setSelectedPermission(page.permissions || "STAFF_ONLY");
    setShowPermissionsModal(true);
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
  
  // 處理新增外部連結
  const handleAddExternalLink = async () => {
    if (!selectedPage) return;
    if (!linkData.url || !linkData.name) {
      alert('請填寫連結網址和名稱');
      return;
    }
    
    try {
      // 確保URL以http://或https://開頭
      let url = linkData.url;
      if (!/^https?:\/\//.test(url)) {
        url = 'https://' + url;
      }
      
      // 使用修正後的URL更新linkData
      const updatedLinkData = {
        ...linkData,
        url: url,
        isExternalLink: true
      };
      
      console.log("添加外部連結:", updatedLinkData);
      
      const response = await addExternalLink(selectedPage._id, updatedLinkData, token);
      console.log("服務器響應:", response);
      
      // 重新獲取檔案列表
      const updatedFiles = await getPageFiles(selectedPage._id, token);
      setFiles(updatedFiles);
      
      // 清空表單並關閉彈窗
      setLinkData({ url: "", name: "", description: "" });
      setShowAddLinkModal(false);
      
      alert("連結新增成功");
    } catch (error) {
      console.error("Error adding link:", error);
      alert("連結新增失敗: " + (error.response?.data?.message || error.message));
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    
    try {
      await addNote(id, noteContent, token);
      
      // 建立一個新的便利貼
      const newNote = {
        id: Date.now().toString(), // 臨時ID，會在重新加載時更新為實際ID
        content: noteContent,
        createdAt: new Date().toISOString(),
        x: 100 + (stickyNotes.length % 3) * 220,
        y: 100 + Math.floor(stickyNotes.length / 3) * 170,
        color: selectedNoteColor,
        rotate: Math.random() * 6 - 3 + 'deg' // -3 to +3 degrees
      };
      
      setStickyNotes([...stickyNotes, newNote]);
      setNoteContent("");
      setShowStickyNotes(true);
      loadProject();
    } catch (err) {
      console.error(err);
      alert("新增備註失敗");
    }
  };

  const handleAddMessage = async () => {
    if (!messageContent.trim()) return;
    
    try {
      await addMessage(id, messageContent, token);
      setMessageContent("");
      loadProject();
    } catch (err) {
      console.error(err);
      alert("發送訊息失敗");
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
  
  // Format datetime for display
  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  
  // 便利貼拖曳功能實現
  const [draggedNote, setDraggedNote] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const handleStickyNoteMouseDown = (e, noteId) => {
    if (e.target.classList.contains('action-btn')) return;
    
    const note = stickyNotes.find(n => n.id === noteId);
    if (!note) return;
    
    const noteElement = e.currentTarget;
    const rect = noteElement.getBoundingClientRect();
    
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    setDraggedNote(noteId);
    e.preventDefault();
  };
  
  const handleStickyNoteMouseMove = (e) => {
    if (!draggedNote) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    setStickyNotes(notes => notes.map(note => 
      note.id === draggedNote ? { ...note, x: newX, y: newY } : note
    ));
  };
  
  const handleStickyNoteMouseUp = () => {
    setDraggedNote(null);
  };
  
  useEffect(() => {
    if (draggedNote) {
      document.addEventListener('mousemove', handleStickyNoteMouseMove);
      document.addEventListener('mouseup', handleStickyNoteMouseUp);
    } else {
      document.removeEventListener('mousemove', handleStickyNoteMouseMove);
      document.removeEventListener('mouseup', handleStickyNoteMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleStickyNoteMouseMove);
      document.removeEventListener('mouseup', handleStickyNoteMouseUp);
    };
  }, [draggedNote]);
  
  // 當項目加載時，初始化便利貼並檢查是否顯示
  useEffect(() => {
    if (project && project.notes) {
      // 嘗試從localStorage中讀取便利貼位置和顯示狀態
      const savedNotesPositions = localStorage.getItem(`project-${id}-notes-positions`);
      const savedShowStickyNotes = localStorage.getItem(`project-${id}-show-sticky-notes`);
      
      // 如果之前保存過便利貼顯示狀態，則使用保存的狀態
      if (savedShowStickyNotes !== null) {
        setShowStickyNotes(savedShowStickyNotes === 'true');
      }
      
      // 如果之前保存過便利貼位置，則使用保存的位置
      if (savedNotesPositions) {
        try {
          const savedPositions = JSON.parse(savedNotesPositions);
          
          // 將保存的位置與當前便利貼合併
          const initialNotes = project.notes.map((note) => {
            const savedPosition = savedPositions.find(pos => pos.id === note._id);
            
            if (savedPosition) {
              return {
                id: note._id,
                content: note.content,
                createdAt: note.createdAt,
                x: savedPosition.x,
                y: savedPosition.y,
                color: savedPosition.color || 'yellow',
                rotate: savedPosition.rotate || `${Math.random() * 6 - 3}deg`
              };
            } else {
              // 對於新便利貼，隨機位置和顏色
              const index = Math.floor(Math.random() * 10);
              return {
                id: note._id,
                content: note.content,
                createdAt: note.createdAt,
                x: 100 + (index % 3) * 220,
                y: 100 + Math.floor(index / 3) * 170,
                color: ['yellow', 'green', 'blue', 'pink'][index % 4],
                rotate: `${Math.random() * 6 - 3}deg` // -3 to +3 degrees
              };
            }
          });
          
          setStickyNotes(initialNotes);
        } catch (e) {
          console.error('Error parsing saved notes positions:', e);
          // 如果解析失敗，使用默認位置
          initializeDefaultStickyNotes(project.notes);
        }
      } else {
        // 如果沒有保存過位置，則使用默認位置
        initializeDefaultStickyNotes(project.notes);
      }
    }
  }, [project, id]);
  
  // 初始化默認便利貼位置的輔助函數
  const initializeDefaultStickyNotes = (notes) => {
    const initialNotes = notes.map((note, index) => ({
      id: note._id,
      content: note.content,
      createdAt: note.createdAt,
      x: 100 + (index % 3) * 220,
      y: 100 + Math.floor(index / 3) * 170,
      color: ['yellow', 'green', 'blue', 'pink'][index % 4],
      rotate: `${Math.random() * 6 - 3}deg` // -3 to +3 degrees
    }));
    setStickyNotes(initialNotes);
  };
  
  // 保存便利貼位置到localStorage
  useEffect(() => {
    if (stickyNotes.length > 0) {
      // 只保存必要的位置信息
      const positionsToSave = stickyNotes.map(note => ({
        id: note.id,
        x: note.x,
        y: note.y,
        color: note.color,
        rotate: note.rotate
      }));
      
      localStorage.setItem(`project-${id}-notes-positions`, JSON.stringify(positionsToSave));
    }
  }, [stickyNotes, id]);
  
  // 刪除訊息和備註功能
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('確定要刪除此訊息？')) return;
    
    try {
      // 刪除訊息的API調用將在更新控制器端點後實現
      // await deleteMessage(id, messageId, token);
      // 暫時使用前端過濾的方式更新UI
      const updatedMessages = project.messages.filter(msg => msg._id !== messageId);
      setProject({...project, messages: updatedMessages});
    } catch (err) {
      console.error(err);
      alert('刪除訊息失敗');
    }
  };
  
  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('確定要刪除此備註？')) return;
    
    try {
      // 調用API刪除備註
      await deleteNote(id, noteId, token);
      
      // 更新前端UI
      const updatedNotes = project.notes.filter(note => note._id !== noteId);
      setProject({...project, notes: updatedNotes});
      
      // 同時從便利貼中移除
      setStickyNotes(stickyNotes.filter(note => note.id !== noteId));
      
      // 從localStorage中刪除便利貼位置
      const savedNotesPositions = localStorage.getItem(`project-${id}-notes-positions`);
      if (savedNotesPositions) {
        try {
          const positions = JSON.parse(savedNotesPositions);
          const updatedPositions = positions.filter(pos => pos.id !== noteId);
          localStorage.setItem(`project-${id}-notes-positions`, JSON.stringify(updatedPositions));
        } catch (e) {
          console.error('Error updating localStorage after note deletion:', e);
        }
      }
    } catch (err) {
      console.error(err);
      alert('刪除備註失敗');
    }
  };
  
  // 檢查用户權限
  const canDeleteItems = ["god", "admin"].includes(role);

  // Get permission label for display
  const getPermissionLabel = (permission) => {
    return PERMISSION_LABELS[permission] || "權限設定";
  };
  
  // Check if user can manage this page's permissions
  const canManagePagePermissions = (page) => {
    if (!page) return false;
    
    // God can manage all permissions
    if (role === "god") return true;
    
    // Admin can manage permissions except GOD_ONLY
    if (role === "admin") {
      return page.permissions !== "GOD_ONLY";
    }
    
    // Employee can only manage STAFF_ONLY and ALL_STAFF_AND_CUSTOMER
    if (role === "employee") {
      return page.permissions === "STAFF_ONLY" || page.permissions === "ALL_STAFF_AND_CUSTOMER";
    }
    
    return false;
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
              {pages.filter(page => hasPageAccess(page)).map((page) => (
                <li 
                  key={page._id || page.id} 
                  className={`page-item ${selectedPage && (selectedPage._id || selectedPage.id) === (page._id || page.id) ? 'active' : ''}`}
                >
                  <div className="page-header">
                    <span 
                      className="page-name" 
                      onClick={() => setSelectedPage(page)}
                    >
                      {page.name}
                    </span>
                    <span className="page-permission-tag">
                      {getPermissionLabel(page.permissions)}
                    </span>
                  </div>
                  
                  {hasAccess(role, ["god", "admin", "employee"]) && (
                    <div className="page-actions">
                      {canManagePagePermissions(page) && (
                        <button
                          className="action-btn permission-btn"
                          onClick={() => openPermissionsModal(page)}
                        >
                          權限設定
                        </button>
                      )}
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
                                const accessiblePages = pages.filter(p => hasPageAccess(p) && (p._id || p.id) !== (page._id || page.id));
                                setSelectedPage(accessiblePages[0] || null);
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
              onClick={() => setShowFlowchartModal(true)}
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
            <div className="section-divider"></div>
            <button 
              className="action-link" 
              onClick={() => setShowCommunicationModal(true)}
            >
              溝通與訊息
            </button>
            <button 
              className="action-link" 
              onClick={() => {
                const newState = !showStickyNotes;
                setShowStickyNotes(newState);
                // 保存便利貼顯示狀態到localStorage
                localStorage.setItem(`project-${id}-show-sticky-notes`, newState.toString());
              }}
            >
              {showStickyNotes ? "隱藏便利貼" : "顯示便利貼"}
            </button>
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
                    className={`file-item ${selectedFile && selectedFile._id === file._id ? 'active' : ''} ${file.isExternalLink ? 'external-link-item' : ''}`}
                    onMouseEnter={() => handleMouseEnter(file._id)}
                    onMouseLeave={() => handleMouseLeave(file._id)}
                  >
                    <div 
                      className="file-name"
                      onClick={() => {
                        if (file.isExternalLink && file.url) {
                          window.open(file.url, '_blank', 'noopener,noreferrer');
                        } else {
                          setSelectedFile(file);
                        }
                      }}
                    >
                      {file.isExternalLink ? (
                        <span className="link-icon">🔗</span>
                      ) : null}
                      {file.originalname || file.filename || file.name}
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
                  <button
                    className="create-link-btn"
                    onClick={() => setShowAddLinkModal(true)}
                  >
                    新增連結
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
              ) : selectedFile.isExternalLink ? (
                <div className="external-link-preview">
                  <div className="link-info">
                    {selectedFile.description && (
                      <div className="link-description">{selectedFile.description}</div>
                    )}
                    <button 
                      className="open-link-btn"
                      onClick={() => window.open(selectedFile.url, '_blank', 'noopener,noreferrer')}
                    >
                      在新視窗中開啟
                    </button>
                  </div>
                  <div className="iframe-container">
                    <iframe
                      src={selectedFile.url}
                      title={selectedFile.originalname || selectedFile.filename}
                      className="website-frame"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                      onLoad={(e) => console.log("iframe loaded", e)}
                      onError={(e) => console.error("iframe error", e)}
                    />
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

      {/* 中央溝通模態框 */}
      <div className={`communication-modal ${showCommunicationModal ? 'visible' : ''}`}>
        <div className="communication-panel">
          <div className="communication-header">
            <button 
              className={`tab-button ${communicationTab === 'messages' ? 'active' : ''}`}
              onClick={() => setCommunicationTab('messages')}
            >
              溝通記錄
            </button>
            <button 
              className={`tab-button ${communicationTab === 'notes' ? 'active' : ''}`}
              onClick={() => setCommunicationTab('notes')}
            >
              專案備註
            </button>
            <button 
              className="close-button"
              onClick={() => setShowCommunicationModal(false)}
            >
              ✕
            </button>
          </div>
          
          <div className="communication-content">
            {/* 訊息標籤內容 */}
            <div className={`tab-content ${communicationTab === 'messages' ? 'active' : ''}`}>
              <div className="messages-container">
                {project.messages && project.messages.length > 0 ? (
                  <ul className="messages-list">
                    {project.messages.map((msg) => (
                      <li key={msg._id} className="message-item">
                        {canDeleteItems && (
                          <div className="item-actions">
                            <button 
                              className="action-btn delete-btn"
                              onClick={() => handleDeleteMessage(msg._id)}
                              title="刪除"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                        <div className="message-header">
                          <span className="message-sender">{msg.sender || "系統"}</span>
                          <span className="message-date">
                            {formatDateTime(msg.createdAt)}
                          </span>
                        </div>
                        <span className="message-content">{msg.message}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">💬</div>
                    <div className="empty-text">暫無訊息記錄，開始對話吧</div>
                  </div>
                )}
              </div>
              
              <div className="input-container">
                <textarea
                  className="content-input"
                  placeholder="輸入訊息 (將同步至Discord)"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault(); // 阻止換行
                      if (messageContent.trim()) handleAddMessage();
                    }
                  }}
                  style={{height: Math.min(120, Math.max(40, messageContent.split('\n').length * 24)) + 'px'}}
                />
                
                <div className="input-actions">
                  <div></div> {/* 留空以對齊右側按鈕 */}
                  
                  <div className="action-buttons">
                    {messageContent && (
                      <button 
                        className="cancel-btn"
                        onClick={() => setMessageContent("")}
                      >
                        取消
                      </button>
                    )}
                    <button 
                      className="send-btn"
                      onClick={handleAddMessage}
                      disabled={!messageContent.trim()}
                    >
                      <span>發送</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 備註標籤內容 */}
            <div className={`tab-content ${communicationTab === 'notes' ? 'active' : ''}`}>
              <div className="notes-container">
                {project.notes && project.notes.length > 0 ? (
                  <ul className="notes-list">
                    {project.notes.map((note) => (
                      <li key={note._id} className="note-item">
                        {canDeleteItems && (
                          <div className="item-actions">
                            <button 
                              className="action-btn delete-btn"
                              onClick={() => handleDeleteNote(note._id)}
                              title="刪除"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                        <span className="note-content">{note.content}</span>
                        <span className="note-date">
                          {formatDateTime(note.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    <div className="empty-text">暫無備註，新增一則吧</div>
                  </div>
                )}
              </div>
              
              <div className="input-container">
                <textarea
                  className="content-input"
                  placeholder="輸入備註"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault(); // 阻止換行
                      if (noteContent.trim()) handleAddNote();
                    }
                  }}
                  style={{height: Math.min(120, Math.max(40, noteContent.split('\n').length * 24)) + 'px'}}
                />
                
                <div className="input-actions">
                  <div className="note-colors">
                    {['yellow', 'green', 'blue', 'pink'].map(color => (
                      <div 
                        key={color}
                        className={`color-dot ${color} ${selectedNoteColor === color ? 'selected' : ''}`}
                        onClick={() => setSelectedNoteColor(color)}
                        title={color}
                      />
                    ))}
                  </div>
                  
                  <div className="action-buttons">
                    {noteContent && (
                      <button 
                        className="cancel-btn"
                        onClick={() => setNoteContent("")}
                      >
                        取消
                      </button>
                    )}
                    <button 
                      className="send-btn"
                      onClick={handleAddNote}
                      disabled={!noteContent.trim()}
                    >
                      新增便利貼
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 便利貼容器 */}
      {showStickyNotes && (
        <div className="sticky-notes-container">
          {stickyNotes.map(note => (
            <div 
              key={note.id} 
              className={`sticky-note ${note.color}`}
              style={{
                top: `${note.y}px`,
                left: `${note.x}px`,
                '--rotate': note.rotate
              }}
              onMouseDown={(e) => handleStickyNoteMouseDown(e, note.id)}
            >
              {canDeleteItems && (
                <div className="sticky-note-actions">
                  <button 
                    className="action-btn"
                    onClick={() => handleDeleteNote(note.id)}
                    title="刪除"
                  >
                    ✕
                  </button>
                </div>
              )}
              <div className="sticky-note-content">{note.content}</div>
              <div className="sticky-note-date">{formatDateTime(note.createdAt)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedPage && (
        <div className="modal-overlay">
          <div className="permissions-modal">
            <h3 className="modal-title">設定頁面權限</h3>
            <p className="page-name">{selectedPage.name}</p>
            
            <div className="permission-options">
              {getAvailablePermissions().map(permission => (
                <div className="permission-option" key={permission}>
                  <input
                    type="radio"
                    id={permission}
                    name="pagePermission"
                    value={permission}
                    checked={selectedPermission === permission}
                    onChange={() => setSelectedPermission(permission)}
                  />
                  <label htmlFor={permission}>
                    {getPermissionLabel(permission)}
                    <span className="permission-description">
                      {permission === "GOD_ONLY" && "（僅系統管理員可查看）"}
                      {permission === "STAFF_ONLY" && "（僅內部員工可查看）"}
                      {permission === "ALL_STAFF_AND_CUSTOMER" && "（所有人員和客戶可查看）"}
                      {permission === "MANAGEMENT_AND_CUSTOMER" && "（管理層和客戶可查看）"}
                    </span>
                  </label>
                </div>
              ))}
            </div>
            
            <div className="modal-actions">
              <button 
                className="modal-btn cancel-btn"
                onClick={() => setShowPermissionsModal(false)}
              >
                取消
              </button>
              <button 
                className="modal-btn save-btn"
                onClick={() => handleUpdatePagePermissions(selectedPage._id, selectedPermission)}
              >
                保存設定
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 流程圖彈窗 */}
      {showFlowchartModal && (
        <div className="flowchart-modal">
          <div className="flowchart-modal-content">
            <div className="flowchart-modal-header">
              <h3 className="flowchart-modal-title">案件流程圖 - {project.projectName}</h3>
              <button 
                className="flowchart-modal-close"
                onClick={() => setShowFlowchartModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="flowchart-modal-body">
              <iframe 
                src={`/flowchart-editor/${id}`}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  border: 'none',
                  display: 'block'
                }}
                title="專案流程圖"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* 外部連結彈窗 */}
      {showAddLinkModal && (
        <div className="modal-overlay">
          <div className="external-link-modal">
            <h3 className="modal-title">新增外部連結</h3>
            
            <div className="link-form">
              <div className="form-group">
                <label htmlFor="linkName">連結名稱:</label>
                <input 
                  type="text" 
                  id="linkName" 
                  value={linkData.name} 
                  onChange={(e) => setLinkData({...linkData, name: e.target.value})}
                  placeholder="請輸入連結名稱"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="linkUrl">URL:</label>
                <input 
                  type="text" 
                  id="linkUrl" 
                  value={linkData.url} 
                  onChange={(e) => setLinkData({...linkData, url: e.target.value})}
                  placeholder="https://example.com"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="linkDescription">描述:</label>
                <textarea 
                  id="linkDescription" 
                  value={linkData.description} 
                  onChange={(e) => setLinkData({...linkData, description: e.target.value})}
                  placeholder="描述此連結的用途（選填）"
                />
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="modal-btn cancel-btn"
                onClick={() => {
                  setShowAddLinkModal(false);
                  setLinkData({ url: "", name: "", description: "" });
                }}
              >
                取消
              </button>
              <button 
                className="modal-btn save-btn"
                onClick={handleAddExternalLink}
                disabled={!linkData.url || !linkData.name}
              >
                新增連結
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectDetailsWithFiles;