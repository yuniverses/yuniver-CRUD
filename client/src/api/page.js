// src/api/page.js
import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const getPages = async (projectId, token) => {
  const res = await axios.get(`${API_URL}/pages/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const createPage = async (projectId, pageData, token) => {
  const res = await axios.post(`${API_URL}/pages/${projectId}`, pageData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// 新增 getPageFiles 方法
export const getPageFiles = async (pageId, token) => {
  const res = await axios.get(`${API_URL}/pages/files/${pageId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
// 刪除頁面
export const deletePage = async (pageId, token) => {
  const res = await axios.delete(`${API_URL}/pages/${pageId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// 重新命名頁面
export const renamePage = async (pageId, newName, token) => {
  const res = await axios.put(
    `${API_URL}/pages/${pageId}`,
    { newName },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};