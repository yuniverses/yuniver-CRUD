// client/src/api/file.js
import axios from "axios";
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

export const uploadFile = async (pageId, fileObj, token) => {
  const formData = new FormData();
  formData.append("pageId", pageId);
  formData.append("file", fileObj);
  const res = await axios.post(`${API_URL}/files/upload`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const getProjectFiles = async (pageId, token) => {
  const res = await axios.get(`${API_URL}/pages/files/${pageId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const downloadFile = async (fileName, token) => {
  const response = await axios.get(`${API_URL}/files/download/${fileName}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    responseType: "blob",
  });
  return response;
};

export const deleteFile = async (fileId, token) => {
  const res = await axios.delete(`${API_URL}/files/${fileId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const renameFile = async (fileId, newName, token) => {
  const res = await axios.put(
    `${API_URL}/files/rename/${fileId}`,
    { newName },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};

// 新增文件（線上文字文件）
export const createDocument = async (pageId, documentData, token) => {
  const res = await axios.post(
    `${API_URL}/files/document`,
    { pageId, ...documentData },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};

// 更新文件內容
export const updateDocument = async (fileId, content, token) => {
  const res = await axios.put(
    `${API_URL}/files/document/${fileId}`,
    { content },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};

// 新增外部連結
export const addExternalLink = async (pageId, linkData, token) => {
  const res = await axios.post(
    `${API_URL}/files/link`,
    { pageId, ...linkData },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};

// 更新外部連結
export const updateExternalLink = async (linkId, linkData, token) => {
  const res = await axios.put(
    `${API_URL}/files/link/${linkId}`,
    linkData,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};
