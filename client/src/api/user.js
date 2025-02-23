// src/api/user.js
import axios from "axios";
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

export const getUsers = async (token) => {
  const res = await axios.get(`${API_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// 直接將 getUsers 作為 getAllUsers 匯出
export const getAllUsers = getUsers;

export const createUser = async (userData, token) => {
  const res = await axios.post(`${API_URL}/users`, userData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updateUser = async (userId, userData, token) => {
  const res = await axios.put(`${API_URL}/users/${userId}`, userData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const deleteUser = async (userId, token) => {
  const res = await axios.delete(`${API_URL}/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
