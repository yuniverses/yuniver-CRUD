import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const getInbox = async (token) => {
  const res = await axios.get(`${API_URL}/mail/inbox`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// 範例：寄信
export const sendMail = async (to, subject, body, token) => {
  const res = await axios.post(`${API_URL}/mail/send`, { to, subject, body }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// 取得專案訊息
export const getProjectMessages = async (projectId, token) => {
  try {
    const res = await axios.get(`${API_URL}/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.messages || [];
  } catch (error) {
    console.error('Error fetching project messages:', error);
    throw error;
  }
};

// 新增專案訊息
export const addProjectMessage = async (projectId, message, token) => {
  try {
    const res = await axios.post(
      `${API_URL}/projects/${projectId}/messages`, 
      { message }, 
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  } catch (error) {
    console.error('Error adding project message:', error);
    throw error;
  }
};
