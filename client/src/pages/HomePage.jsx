// client/src/pages/HomePage.jsx
import React from "react";
import { Link } from "react-router-dom";

function HomePage() {
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
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* 左側選單 */}
      <div style={{ width: "200px", background: "#f5f5f5", padding: "20px" }}>
        <h3>YUNIVER</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
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
              <Link to="/project-manager">專案管理</Link>
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
          <li>
            <button onClick={handleLogout}>登出</button>
          </li>
        </ul>
      </div>

      {/* 右側主內容區 */}
      <div style={{ flex: 1, padding: "20px" }}>
        <h2>首頁 (Dashboard)</h2>
        <p>這裡可以放一些系統總覽、公告、或最新專案更新等。</p>
      </div>
    </div>
  );
}

export default HomePage;
