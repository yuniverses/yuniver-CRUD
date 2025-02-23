import React, { useState } from "react";
import { loginUser } from "../api/auth";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await loginUser(username, password);
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
