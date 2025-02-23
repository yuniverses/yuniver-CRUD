// src/pages/ProjectDetailsWithFiles.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProjectDetails, addNote, addMessage } from '../api/project';
import { getPages, createPage, getPageFiles } from '../api/page';
import { uploadFile, downloadFile, deleteFile, renameFile } from '../api/file';

function ProjectDetailsWithFiles() {
  const { id } = useParams();
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  useEffect(() => {
    loadProject();
    loadPages();
  }, [id]);

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
      setFiles(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedPage) {
      loadFiles(selectedPage._id);
    }
  }, [selectedPage]);

  const handleCreatePage = async () => {
    const pageName = prompt("請輸入頁面名稱：", "New Page");
    if (!pageName) return;
    try {
      const newPage = await createPage(id, { name: pageName }, token);
      setPages(prev => [...prev, newPage]);
      setSelectedPage(newPage);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedPage) return;
    try {
      // 呼叫 uploadFile API 時，傳入 selectedPage._id 作為 pageId
      const uploadedFile = await uploadFile(selectedPage._id, file, token);
      // Option 1: 更新 state，加入上傳成功的檔案
      setFiles(prevFiles => [...prevFiles, uploadedFile]);
      // Option 2: 重新從後端載入檔案列表
      // await loadFiles(selectedPage._id);
    } catch (err) {
      console.error(err);
      alert("File upload failed");
    }
  };

  const handleFileDownload = async (fileName) => {
    try {
      const res = await downloadFile(fileName, token);
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
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
      setFiles(prevFiles => prevFiles.filter(file => file._id !== fileId));
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
      setFiles(prevFiles => prevFiles.map(file => file._id === fileId ? updatedFile : file));
    } catch (err) {
      console.error(err);
      alert("File rename failed");
    }
  };

  const handleAddNote = async () => {
    try {
      await addNote(id, noteContent, token);
      alert('備註已新增');
      setNoteContent('');
      loadProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMessage = async () => {
    try {
      await addMessage(id, messageContent, token);
      alert('訊息已新增');
      setMessageContent('');
      loadProject();
    } catch (err) {
      console.error(err);
    }
  };

  if (!project) return <div style={{ padding: '20px' }}>Loading project...</div>;

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* 左側側邊欄 */}
      <div style={{ width: '250px', borderRight: '1px solid #ccc', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h2>專案資訊</h2>
          <p>客戶名稱：{project.clientName}</p>
          <p>專案名稱：{project.projectName}</p>
          <p>負責人：{project.owner?.username || 'N/A'}</p>
          <p>
            期間：{project.period?.startDate ? new Date(project.period.startDate).toLocaleDateString() : ''} ~ {project.period?.endDate ? new Date(project.period.endDate).toLocaleDateString() : ''}
          </p>
        </div>
        <div>
          <h3>頁面列表</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {pages.map(page => (
              <li key={page._id} style={{ cursor: 'pointer', marginBottom: '5px', fontWeight: selectedPage && selectedPage._id === page._id ? 'bold' : 'normal' }}
                onClick={() => setSelectedPage(page)}>
                {page.name}
              </li>
            ))}
          </ul>
          <button onClick={handleCreatePage}>新增頁面</button>
        </div>
        <div>
          <button onClick={() => navigate(`/flowchart-editor/${id}`)}>案件流程圖</button>
          <button onClick={() => navigate(`/project-settings/${id}`)} style={{ marginTop: '10px' }}>案件資訊設定</button>
        </div>
      </div>

      {/* 中間區域：檔案列表與檔案上傳 */}
      <div style={{ width: '300px', borderRight: '1px solid #ccc', padding: '10px' }}>
        <h2>檔案列表</h2>
        {selectedPage ? (
          <div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {files.map(file => (
                <li key={file._id || file.filename} style={{ cursor: 'pointer', marginBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span onClick={() => setSelectedFile(file)}>{file.filename}</span>
                  <span>
                    <button onClick={() => handleRenameFile(file._id)} style={{ marginRight: '5px' }}>Rename</button>
                    <button onClick={() => handleDeleteFile(file._id)}>Delete</button>
                  </span>
                </li>
              ))}
            </ul>
            <label>
              上傳檔案:
              <input type="file" onChange={handleFileUpload} style={{ display: 'block', marginTop: '5px' }} />
            </label>
          </div>
        ) : (
          <p>請選擇一個頁面</p>
        )}
      </div>

      {/* 最右側：檔案預覽 */}
      <div style={{ flex: 1, padding: '10px' }}>
        <h2>檔案預覽</h2>
        {selectedFile ? (
          <div>
            {/* 此處以 iframe 示意預覽，實際可根據檔案類型進行處理 */}
            <iframe src={URL.createObjectURL(new Blob([]))} title="File Preview" style={{ width: '100%', height: '80%' }}></iframe>
            <button onClick={() => handleFileDownload(selectedFile.filename)}>下載檔案</button>
          </div>
        ) : (
          <p>請從檔案列表中選擇檔案以預覽</p>
        )}
      </div>

      {/* 備註與溝通視窗，使用懸浮呈現 */}
      <div style={{ position: 'fixed', bottom: 20, right: 20, width: '300px' }}>
        <div style={{ backgroundColor: '#fff', border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
          <button onClick={() => setShowNotes(prev => !prev)}>備註 {showNotes ? '隱藏' : '顯示'}</button>
          {showNotes && (
            <div>
              <h3>備註</h3>
              <ul>
                {project.notes?.map(note => (
                  <li key={note._id}>
                    {note.content} <small>({new Date(note.createdAt).toLocaleString()})</small>
                  </li>
                ))}
              </ul>
              <input placeholder="輸入備註" value={noteContent} onChange={e => setNoteContent(e.target.value)} />
              <button onClick={handleAddNote}>新增備註</button>
            </div>
          )}
        </div>
        <div style={{ backgroundColor: '#fff', border: '1px solid #ccc', padding: '10px' }}>
          <button onClick={() => setShowMessages(prev => !prev)}>溝通 {showMessages ? '隱藏' : '顯示'}</button>
          {showMessages && (
            <div>
              <h3>溝通記錄</h3>
              <ul>
                {project.messages?.map(msg => (
                  <li key={msg._id}>
                    {msg.message} <small>({new Date(msg.createdAt).toLocaleString()})</small>
                  </li>
                ))}
              </ul>
              <input placeholder="輸入訊息" value={messageContent} onChange={e => setMessageContent(e.target.value)} />
              <button onClick={handleAddMessage}>新增訊息</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailsWithFiles;
