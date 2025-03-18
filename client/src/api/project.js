//client/src/api/project.js

import axios from "axios";


const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

// 取得所有專案
export const fetchAllProjects = async (token) => {
  const res = await axios.get(`${API_URL}/projects`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// 建立專案
export const createProject = async (projectData, token) => {
  const res = await axios.post(`${API_URL}/projects`, projectData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// 取得單一專案
export const getProjectDetails = async (projectId, token) => {
  const res = await axios.get(`${API_URL}/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// 更新專案
export const updateProject = async (projectId, projectData, token) => {
  const res = await axios.put(`${API_URL}/projects/${projectId}`, projectData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// 刪除專案
export const deleteProject = async (projectId, token) => {
  const res = await axios.delete(`${API_URL}/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// 新增備註(便條紙)
export const addNote = async (projectId, content, token) => {
  const res = await axios.post(
    `${API_URL}/projects/${projectId}/notes`,
    { content },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};

// 刪除備註
export const deleteNote = async (projectId, noteId, token) => {
  const res = await axios.delete(
    `${API_URL}/projects/${projectId}/notes/${noteId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};

// 新增溝通訊息 (不帶附件時使用)
export const addMessage = async (projectId, message, token) => {
  const res = await axios.post(
    `${API_URL}/projects/${projectId}/messages`,
    { message },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};

// 完全重寫，確保使用正確的API路徑
// 新增帶附件的溝通訊息 (使用FormData)
export const addMessageWithAttachments = async (projectId, message, attachments, token) => {
  try {
    console.log("準備新增帶附件的訊息");
    console.log("BASE_URL:", BASE_URL);
    console.log("API_URL:", API_URL);
    
    // 建立FormData物件
    const formData = new FormData();
    formData.append('message', message);
    
    // 添加所有附件
    if (attachments && attachments.length > 0) {
      console.log(`添加 ${attachments.length} 個附件`);
      for (let i = 0; i < attachments.length; i++) {
        formData.append('attachments', attachments[i]);
        console.log(`已添加附件 ${i+1}: ${attachments[i].name}`);
      }
    }
    
    // 構建正確的URL
    const url = `${API_URL}/projects/${projectId}/messages`;
    console.log("發送請求到:", url);
    
    // 發送請求
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    // 檢查響應
    if (!res.ok) {
      const errorText = await res.text();
      console.error("請求失敗:", res.status, errorText);
      throw new Error(`請求失敗: ${res.status} ${errorText}`);
    }
    
    // 返回解析後的JSON數據
    const data = await res.json();
    console.log("請求成功:", data);
    return data;
  } catch (error) {
    console.error("添加帶附件訊息出錯:", error);
    throw error;
  }
};

export const updateProjectSettings = async (projectId, settings, token) => {
  const res = await axios.put(
    `${API_URL}/projects/${projectId}/settings`,
    settings,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

// 獲取未讀訊息數量
export const getUnreadMessageCount = async (projectId, token) => {
  const res = await axios.get(
    `${API_URL}/projects/${projectId}/messages/unread`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

// 標記訊息為已讀
export const markMessagesAsRead = async (projectId, token) => {
  const res = await axios.post(
    `${API_URL}/projects/${projectId}/messages/read`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};
