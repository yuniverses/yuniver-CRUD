// client/src/pages/HomePage.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../css/shared-layout.css";

function HomePage() {
  const [activeTab, setActiveTab] = useState("main");

  // 取得並解碼 JWT Token 中的角色資訊
  const getRole = () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.role || null;
      } catch (err) {
        console.error("Token 解碼錯誤:", err);
        return null;
      }
    }
    return null;
  };

  // 簡單權限檢查函式，檢查當前角色是否在允許列表中
  const hasAccess = (role, allowedRoles) => {
    return allowedRoles.includes(role);
  };

  const role = getRole();

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="yuniver-container">
      {/* Header */}
      <header className="yuniver-header">
        <div className="yuniver-logo">
          <h1>YUNIVER <span className="registered-mark">®</span></h1>
          <p className="subtitle">案件進度及檔案系統</p>
        </div>
        <nav className="main-nav">
          <a href="/" className={activeTab === "main" ? "active" : ""} onClick={() => setActiveTab("main")}>
            主頁
          </a>
          <a href="/mail" className={activeTab === "mail" ? "active" : ""} onClick={() => setActiveTab("mail")}>
            mail
          </a>
          <a href="/logout" className="logout-btn" onClick={handleLogout}>登出</a>
        </nav>
      </header>

      <div className="yuniver-content">
        {/* 左側選單 */}
        <div className="yuniver-sidebar">
          <ul className="sidebar-menu">
            <li>
              <Link to="/projects">專案列表</Link>
            </li>
            {/* 僅當用戶角色為 god 或 admin 時才顯示 */}
            {hasAccess(role, ["god", "admin", "employee"]) && (
              <li>
                <Link to="/mail">Mail</Link>
              </li>
            )}
            {/* 僅當用戶角色為 god 或 admin 時才顯示 */}
            {hasAccess(role, ["god", "admin", "employee"]) && (
              <li>
                <Link to="/internal-files">內部檔案</Link>
              </li>
            )}
            {/* 僅當用戶角色為 god 或 admin 時才顯示 */}
            {hasAccess(role, ["god", "admin"]) && (
              <li>
                <Link to="/project-manager">專案編輯與設定</Link>
              </li>
            )}
            {/* 僅當用戶角色為 god 或 admin 時才顯示 */}
            {hasAccess(role, ["god", "admin","employee"]) && (
              <li>
                <Link to="/ProjectManagement">專案管理ALL</Link>
              </li>
            )}
            {/* 僅當用戶角色為 god 或 admin 時才顯示 */}
            {hasAccess(role, ["god", "admin", "employee"]) && (
              <li>
                <Link to="/quotation">報價單</Link>
              </li>
            )}
            
            {/* 僅當用戶角色為 god 或 admin 時才顯示 */}
            {hasAccess(role, ["god", "admin"]) && (
              <li>
                <Link to="/usermanagement">身份管理</Link>
              </li>
            )}
          </ul>
        </div>

        {/* 右側主內容區 */}
        <div className="main-content">
          <h2 className="page-title">首頁 (Dashboard)</h2>
          <p>這裡可以放一些系統總覽、公告、或最新專案更新等。</p>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
