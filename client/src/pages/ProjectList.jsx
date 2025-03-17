// client/src/pages/ProjectList.jsx
import React, { useEffect, useState } from 'react';
import { fetchAllProjects } from '../api/project';
import { Link } from 'react-router-dom';
import "../css/shared-layout.css";

function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState("projects");
  const token = localStorage.getItem('token');

  // 從 token 解碼取得用戶資訊（id 與 role）
  const getUserFromToken = () => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
          // 優先使用 userId，其次再 fallback 到 _id 或 id
          id: payload.userId || payload._id || payload.id,
          role: payload.role,
        };
      } catch (err) {
        console.error("Token 解碼失敗:", err);
      }
    }
    return { id: null, role: null };
  };

  const user = getUserFromToken();

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await fetchAllProjects(token);
        setProjects(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadProjects();
  }, [token]);

  // 過濾專案：若用戶角色非 god/admin，則僅顯示 accessControl 陣列中包含當前用戶 id 的專案
  const filteredProjects = projects.filter((proj) => {
    if (user.role === 'god' || user.role === 'admin') {
      return true;
    }
    if (proj.accessControl && Array.isArray(proj.accessControl)) {
      return proj.accessControl.some((item) => String(item.user) === String(user.id));
    }
    return false;
  });

  // 簡單權限檢查函式，檢查當前角色是否在允許列表中
  const hasAccess = (role, allowedRoles) => {
    return allowedRoles.includes(role);
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
              <Link to="/projects" className="active">專案列表</Link>
            </li>
            {/* 僅當用戶角色為 god 或 admin 時才顯示 */}
            {hasAccess(user.role, ["god", "admin", "employee"]) && (
              <li>
                <Link to="/mail">Mail</Link>
              </li>
            )}
            {/* 僅當用戶角色為 god 或 admin 時才顯示 */}
            {hasAccess(user.role, ["god", "admin", "employee"]) && (
              <li>
                <Link to="/internal-files">內部檔案</Link>
              </li>
            )}
            {/* 僅當用戶角色為 god 或 admin 時才顯示 */}
            {hasAccess(user.role, ["god", "admin"]) && (
              <li>
                <Link to="/project-manager">專案編輯與設定</Link>
              </li>
            )}
            {/* 僅當用戶角色為 god 或 admin 時才顯示 */}
            {hasAccess(user.role, ["god", "admin","employee"]) && (
              <li>
                <Link to="/ProjectManagement">專案管理ALL</Link>
              </li>
            )}
            {/* 僅當用戶角色為 god 或 admin 時才顯示 */}
            {hasAccess(user.role, ["god", "admin", "employee"]) && (
              <li>
                <Link to="/quotation">報價單</Link>
              </li>
            )}
            
            {/* 僅當用戶角色為 god 或 admin 時才顯示 */}
            {hasAccess(user.role, ["god", "admin"]) && (
              <li>
                <Link to="/usermanagement">身份管理</Link>
              </li>
            )}
          </ul>
        </div>

        {/* 右側主內容區 */}
        <div className="main-content">
          <h2 className="page-title">專案列表</h2>
          {filteredProjects.length > 0 ? (
            <table className="yuniver-table">
              <thead>
                <tr>
                  <th>客戶名稱</th>
                  <th>專案名稱</th>
                  <th>負責人</th>
                  <th>進行中項目</th>
                  <th>期間</th>
                  <th>詳細</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((proj) => (
                  <tr key={proj._id}>
                    <td>{proj.clientName}</td>
                    <td>{proj.projectName}</td>
                    <td>{proj.owner?.username || 'N/A'}</td>
                    <td>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {proj.flowChart && proj.flowChart.filter((node) => node.type === "task" && node.status === "進行中")
                          .map((task) => (
                            <li key={task.id}>
                              {task.label || "Unnamed Task"}
                            </li>
                          ))}
                      </ul>
                    </td>
                    <td>
                      {proj.period?.startDate
                        ? new Date(proj.period.startDate).toLocaleDateString()
                        : ''}{' '}
                      ~{' '}
                      {proj.period?.endDate
                        ? new Date(proj.period.endDate).toLocaleDateString()
                        : ''}
                    </td>
                    <td>
                      <Link to={`/projects/${proj._id}`} className="action-link">查看</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>您沒有權限查看任何專案。</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectList;
