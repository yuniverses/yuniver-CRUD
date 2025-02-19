// client/src/api/file.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// 上傳檔案
export const uploadFile = async (formData, token) => {
  // formData 需要包含 projectId 與 file
  // 例如:
  // const formData = new FormData();
  // formData.append('projectId', 'xxxx');
  // formData.append('file', fileObject);
  try {
    const res = await axios.post(`${API_URL}/files/upload`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

// 取得指定專案的檔案列表
export const getProjectFiles = async (projectId, token) => {
  try {
    const res = await axios.get(`${API_URL}/files/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

// 下載檔案 (前端可另行處理，例如開新視窗或改用 a 標籤 href)
export const downloadFile = async (fileId, token) => {
  try {
    const response = await axios.get(`${API_URL}/files/download/${fileId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: 'blob', // 確保拿到的是二進位檔案
    });
    return response;
  } catch (error) {
    throw error;
  }
};
