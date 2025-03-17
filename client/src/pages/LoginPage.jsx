import React, { useState, useEffect } from "react";
import { loginUser } from "../api/auth";
import "../css/shared-layout.css";

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
    <div className="login-container" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        width: '380px',
        padding: '30px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', letterSpacing: '1px' }}>
            YUNIVER <span style={{ fontSize: '16px', verticalAlign: 'super' }}>®</span>
          </h1>
          <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#666' }}>
            案件進度及檔案系統
          </p>
        </div>
        
        <h2 style={{ marginBottom: '20px', fontSize: '20px', textAlign: 'center' }}>登入系統</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>帳號：</label>
            <input
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>密碼：</label>
            <input
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit"
            className="yuniver-btn"
            style={{ 
              width: '100%', 
              padding: '12px', 
              fontSize: '16px' 
            }}
          >
            登入
          </button>
        </form>
        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
          還沒有帳號？ <a href="/register" style={{ color: '#333', textDecoration: 'underline' }}>去註冊</a>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;