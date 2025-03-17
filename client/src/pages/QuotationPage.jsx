import React, { useState } from 'react';
import { generateQuotationPDF } from '../api/quotation';
import { Link } from 'react-router-dom';
import "../css/shared-layout.css";

function QuotationPage() {
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [items, setItems] = useState([
    // 預設 1 筆
    { description: '設計項目1', price: 5000 },
  ]);
  const [activeTab, setActiveTab] = useState("quotation");

  const token = localStorage.getItem('token');

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

  const handleDownloadPDF = async () => {
    try {
      // 從 state items 產生 PDF
      const res = await generateQuotationPDF(items, clientName, projectName, token);
      // 建立 Blob
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'quotation.pdf';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('報價單產生失敗');
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', price: 0 }]);
  };

  const removeItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  // 計算總金額
  const total = items.reduce((sum, item) => sum + (item.price || 0), 0);

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
                <Link to="/quotation" className="active">報價單</Link>
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
          <h2 className="page-title">報價單產生 (PDF)</h2>
          
          <div style={{ 
            backgroundColor: "#f9f9f9", 
            padding: "20px", 
            borderRadius: "4px",
            border: "1px solid #e0e0e0",
            marginBottom: "20px"
          }}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>客戶名稱：</label>
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                placeholder="請輸入客戶名稱"
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>專案名稱：</label>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                placeholder="請輸入專案名稱"
              />
            </div>
          </div>

          <h3 style={{ marginTop: "30px", marginBottom: "15px", fontSize: "18px" }}>項目列表</h3>
          <table className="yuniver-table">
            <thead>
              <tr>
                <th style={{ width: "65%" }}>項目描述</th>
                <th style={{ width: "25%" }}>費用 (NT$)</th>
                <th style={{ width: "10%" }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => handleItemChange(idx, 'price', parseInt(e.target.value, 10) || 0)}
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                    />
                  </td>
                  <td>
                    <button 
                      onClick={() => removeItem(idx)} 
                      className="yuniver-btn danger"
                      style={{ padding: "5px 10px", fontSize: "12px" }}
                      disabled={items.length <= 1}
                    >
                      移除
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan="3" style={{ textAlign: "center" }}>
                  <button 
                    onClick={addItem} 
                    className="yuniver-btn secondary" 
                    style={{ margin: "10px 0" }}
                  >
                    新增項目
                  </button>
                </td>
              </tr>
              <tr>
                <td style={{ textAlign: "right", fontWeight: "bold" }}>總計：</td>
                <td style={{ fontWeight: "bold" }}>NT$ {total.toLocaleString()}</td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: "30px", textAlign: "center" }}>
            <button 
              onClick={handleDownloadPDF} 
              className="yuniver-btn"
              disabled={!clientName || !projectName || items.some(item => !item.description)}
            >
              產生並下載 PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuotationPage;