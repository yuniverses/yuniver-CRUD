import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

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

// 新增溝通訊息
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

export const updateProjectSettings = async (projectId, settings, token) => {
  const res = await axios.put(
    `${API_URL}/projects/${projectId}/settings`,
    settings,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};
