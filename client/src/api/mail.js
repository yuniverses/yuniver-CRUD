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
