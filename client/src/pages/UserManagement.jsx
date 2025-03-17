// src/pages/UserManagement.jsx
import React, { useState, useEffect } from "react";
import { getUsers, createUser, updateUser, deleteUser } from "../api/user";
import { Link, useNavigate } from "react-router-dom";
import "../css/shared-layout.css";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [newUserData, setNewUserData] = useState({
    username: "",
    password: "",
    role: "customer",
    name: "",
    email: "",
    selfIntro: "",
    note: "",
    phone: "",
    company: "",
  });
  const [activeTab, setActiveTab] = useState("usermanagement");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

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

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getUsers(token);
      setUsers(data);
    } catch (error) {
      console.error("Load users error:", error);
    }
  };

  const handleEditChange = (e) => {
    setEditingUser({ ...editingUser, [e.target.name]: e.target.value });
  };

  const handleNewUserChange = (e) => {
    setNewUserData({ ...newUserData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      await updateUser(editingUser._id, editingUser, token);
      loadUsers();
      setEditingUser(null);
    } catch (error) {
      console.error("Update user error:", error);
      alert("Update failed");
    }
  };

  const handleCreate = async () => {
    try {
      await createUser(newUserData, token);
      loadUsers();
      setNewUserData({
        username: "",
        password: "",
        role: "customer",
        name: "",
        email: "",
        selfIntro: "",
        note: "",
        phone: "",
        company: "",
      });
      alert("User created successfully");
    } catch (error) {
      console.error("Create user error:", error);
      alert("User creation failed");
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("確定要刪除此用戶？")) return;
    
    try {
      await deleteUser(userId, token);
      loadUsers();
    } catch (error) {
      console.error("Delete user error:", error);
      alert("Delete failed");
    }
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
            {hasAccess(role, ["god", "admin", "employee"]) && (
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
                <Link to="/usermanagement" className="active">身份管理</Link>
              </li>
            )}
          </ul>
        </div>

        {/* 右側主內容區 */}
        <div className="main-content">
          <h2 className="page-title">用戶管理</h2>

          <table className="yuniver-table">
            <thead>
              <tr>
                <th>用戶名</th>
                <th>角色</th>
                <th>姓名</th>
                <th>電子郵件</th>
                <th>電話</th>
                <th>公司</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.username}</td>
                  <td>{u.role}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>{u.company}</td>
                  <td>
                    <button 
                      onClick={() => setEditingUser(u)}
                      className="yuniver-btn secondary"
                      style={{ marginRight: "5px", padding: "5px 10px", fontSize: "12px" }}
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => handleDelete(u._id)}
                      className="yuniver-btn danger"
                      style={{ padding: "5px 10px", fontSize: "12px" }}
                    >
                      刪除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {editingUser && (
            <div
              style={{
                marginTop: "30px",
                border: "1px solid #e0e0e0",
                padding: "20px",
                borderRadius: "4px",
                backgroundColor: "#f9f9f9",
              }}
            >
              <h3 style={{ marginTop: "0", borderBottom: "1px solid #e0e0e0", paddingBottom: "10px" }}>編輯用戶</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>用戶名:</label>
                  <input 
                    name="username" 
                    value={editingUser.username} 
                    disabled 
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>姓名:</label>
                  <input
                    name="name"
                    value={editingUser.name || ""}
                    onChange={handleEditChange}
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>電子郵件:</label>
                  <input
                    name="email"
                    value={editingUser.email || ""}
                    onChange={handleEditChange}
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>電話:</label>
                  <input
                    name="phone"
                    value={editingUser.phone || ""}
                    onChange={handleEditChange}
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>公司:</label>
                  <input
                    name="company"
                    value={editingUser.company || ""}
                    onChange={handleEditChange}
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>角色:</label>
                  <select
                    name="role"
                    value={editingUser.role}
                    onChange={handleEditChange}
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                  >
                    <option value="god">God</option>
                    <option value="admin">Admin</option>
                    <option value="employee">Employee</option>
                    <option value="customer">Customer</option>
                  </select>
                </div>
              </div>
              
              <div style={{ marginTop: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>自我介紹:</label>
                <textarea
                  name="selfIntro"
                  value={editingUser.selfIntro || ""}
                  onChange={handleEditChange}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd", minHeight: "80px" }}
                />
              </div>
              <div style={{ marginTop: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>備註:</label>
                <textarea
                  name="note"
                  value={editingUser.note || ""}
                  onChange={handleEditChange}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd", minHeight: "80px" }}
                />
              </div>
              
              <div style={{ marginTop: "20px" }}>
                <button onClick={handleUpdate} className="yuniver-btn">儲存</button>
                <button
                  onClick={() => setEditingUser(null)}
                  className="yuniver-btn secondary"
                  style={{ marginLeft: "10px" }}
                >
                  取消
                </button>
              </div>
            </div>
          )}

          <div
            style={{ 
              marginTop: "30px", 
              border: "1px solid #e0e0e0", 
              padding: "20px", 
              borderRadius: "4px",
              backgroundColor: "#f9f9f9",
            }}
          >
            <h3 style={{ marginTop: "0", borderBottom: "1px solid #e0e0e0", paddingBottom: "10px" }}>新增用戶</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>用戶名:</label>
                <input
                  name="username"
                  value={newUserData.username}
                  onChange={handleNewUserChange}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>密碼:</label>
                <input
                  name="password"
                  type="password"
                  value={newUserData.password}
                  onChange={handleNewUserChange}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>姓名:</label>
                <input
                  name="name"
                  value={newUserData.name}
                  onChange={handleNewUserChange}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>電子郵件:</label>
                <input
                  name="email"
                  value={newUserData.email}
                  onChange={handleNewUserChange}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>電話:</label>
                <input
                  name="phone"
                  value={newUserData.phone}
                  onChange={handleNewUserChange}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>公司:</label>
                <input
                  name="company"
                  value={newUserData.company}
                  onChange={handleNewUserChange}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>角色:</label>
                <select
                  name="role"
                  value={newUserData.role}
                  onChange={handleNewUserChange}
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                >
                  <option value="customer">Customer</option>
                  <option value="employee">Employee</option>
                  {/* 只有god可以建立admin用戶，此處前端僅做展示，實際權限檢查在後端 */}
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <div style={{ marginTop: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>自我介紹:</label>
              <textarea
                name="selfIntro"
                value={newUserData.selfIntro}
                onChange={handleNewUserChange}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd", minHeight: "80px" }}
              />
            </div>
            <div style={{ marginTop: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>備註:</label>
              <textarea
                name="note"
                value={newUserData.note}
                onChange={handleNewUserChange}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd", minHeight: "80px" }}
              />
            </div>
            
            <div style={{ marginTop: "20px" }}>
              <button onClick={handleCreate} className="yuniver-btn">建立用戶</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;