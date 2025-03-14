import React, { useState, useEffect } from "react";
import { loginUser } from "../api/auth";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Add useEffect to check for URL parameters when component mounts
  //https://your-website.com/login?username=youruser&password=yourpass
  useEffect(() => {
    // Get URL parameters
    const params = new URLSearchParams(window.location.search);
    const urlUsername = params.get("username");
    const urlPassword = params.get("password");
    
    // Auto-fill form if parameters exist
    if (urlUsername) setUsername(urlUsername);
    if (urlPassword) setPassword(urlPassword);
    
    // Optional: Auto-submit if both parameters are present
    if (urlUsername && urlPassword) {
      // Use setTimeout to ensure the component is fully mounted
      setTimeout(() => {
        handleLogin(urlUsername, urlPassword);
      }, 500);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleLogin(username, password);
  };
  
  const handleLogin = async (user, pass) => {
    try {
      const data = await loginUser(user, pass);
      localStorage.setItem("token", data.token);
      window.location.href = "/home"; // 導向首頁或 Dashboard
    } catch (err) {
      alert("登入失敗：" + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>登入</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>帳號：</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>密碼：</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">登入</button>
      </form>
      <p>
        還沒有帳號？ <a href="/register">去註冊</a>
      </p>
    </div>
  );
}

export default LoginPage;