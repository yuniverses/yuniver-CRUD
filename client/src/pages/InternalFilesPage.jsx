import React, { useState } from 'react';
import { uploadFile, getProjectFiles, downloadFile } from '../api/file';

function InternalFilesPage() {
  const [projectId, setProjectId] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [files, setFiles] = useState([]);

  const token = localStorage.getItem('token');

  const handleUpload = async () => {
    if (!projectId || !fileToUpload) return;
    try {
      await uploadFile(projectId, fileToUpload, token);
      alert('檔案上傳成功');
    } catch (err) {
      console.error(err);
      alert('檔案上傳失敗');
    }
  };

  const handleGetFiles = async () => {
    if (!projectId) return;
    try {
      const data = await getProjectFiles(projectId, token);
      setFiles(data);
    } catch (err) {
      console.error(err);
      alert('取得檔案列表失敗');
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const res = await downloadFile(fileId, token);
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName || 'downloaded_file';
      link.click();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      alert('檔案下載失敗');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>內部檔案管理</h2>
      <div>
        <label>專案ID: </label>
        <input
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder="輸入專案ID"
        />
      </div>
      <div>
        <label>選擇檔案: </label>
        <input type="file" onChange={(e) => setFileToUpload(e.target.files[0])} />
      </div>
      <button onClick={handleUpload}>上傳檔案</button>
      <button onClick={handleGetFiles}>取得檔案列表</button>

      <ul>
        {files.map((f) => (
          <li key={f._id}>
            {f.fileName}{' '}
            <button onClick={() => handleDownload(f._id, f.fileName)}>下載</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default InternalFilesPage;
