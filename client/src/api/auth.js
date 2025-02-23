//client/src/api/auth.js

import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

// Set the token in headers for each request if it's available
const token = localStorage.getItem("token");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

export const registerUser = async (username, password) => {
  const res = await axios.post(`${API_URL}/auth/register`, {
    username,
    password,
  });
  return res.data;
};

export const loginUser = async (username, password) => {
  try {
    const res = await axios.post(`${API_URL}/auth/login`, {
      username,
      password,
    });
    console.log("Login response:", res.data); // 输出登录返回的数据

    localStorage.setItem("token", res.data.token); // 存储 token
    localStorage.setItem("role", res.data.role); // 存储角色
    console.log("role:" + res.data.role);
    alert("Logged in as: " + res.data.role);

    return res.data;
  } catch (error) {
    console.error("Login error:", error); // 登录失败的日志
  }
};
