import React, { useEffect, useState } from 'react';
import { getInbox, sendMail } from '../api/mail';
import { Link } from 'react-router-dom';
import "../css/shared-layout.css";

function MailPage() {
  const [inbox, setInbox] = useState([]);
  const [selectedMail, setSelectedMail] = useState(null);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [activeTab, setActiveTab] = useState("mail");
  const [showForm, setShowForm] = useState(false);

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

  useEffect(() => {
    loadInbox();
  }, []);

  const loadInbox = async () => {
    try {
      const data = await getInbox(token);
      setInbox(data);
    } catch (err) {
      console.error('Get Inbox Failed', err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      await sendMail(to, subject, body, token);
      alert('寄信成功');
      setTo('');
      setSubject('');
      setBody('');
      setShowForm(false);
      loadInbox(); // 重新載入收件箱
    } catch (err) {
      console.error('Send Mail Failed', err);
      alert('寄信失敗');
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
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="yuniver-btn"
            style={{ width: '100%', marginBottom: '20px' }}
          >
            {showForm ? '取消' : '新增郵件'}
          </button>
          
          <h3 style={{ margin: '20px 0 10px 0' }}>收件匣</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {inbox.map((mail) => (
              <li 
                key={mail._id} 
                onClick={() => setSelectedMail(mail)}
                style={{ 
                  padding: '10px', 
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  backgroundColor: selectedMail && selectedMail._id === mail._id ? '#f0f0f0' : 'transparent'
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{mail.subject}</div>
                <div style={{ fontSize: '0.8em', color: '#666' }}>寄件人: {mail.from}</div>
                <div style={{ fontSize: '0.8em', color: '#666' }}>
                  {new Date(mail.createdAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
          
          <div className="section-divider"></div>
          
          <ul className="sidebar-menu">
            <li>
              <Link to="/projects">專案列表</Link>
            </li>
            {/* 僅當用戶角色為 god 或 admin 時才顯示 */}
            {hasAccess(role, ["god", "admin", "employee"]) && (
              <li>
                <Link to="/mail" className="active">Mail</Link>
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
        
        <div className="main-content">
          {showForm ? (
            <div>
              <h2 className="page-title">新增郵件</h2>
              <form onSubmit={handleSend}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>收件人:</label>
                  <input 
                    type="text" 
                    value={to} 
                    onChange={(e) => setTo(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #e0e0e0' }}
                    required
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>主旨:</label>
                  <input 
                    type="text" 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #e0e0e0' }}
                    required
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>內容:</label>
                  <textarea 
                    value={body} 
                    onChange={(e) => setBody(e.target.value)}
                    style={{ width: '100%', height: '200px', padding: '8px', borderRadius: '4px', border: '1px solid #e0e0e0', resize: 'vertical' }}
                    required
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  className="yuniver-btn"
                >
                  發送
                </button>
              </form>
            </div>
          ) : selectedMail ? (
            <div>
              <h2 className="page-title">{selectedMail.subject}</h2>
              <div style={{ marginBottom: '20px', background: '#f9f9f9', padding: '15px', borderRadius: '4px' }}>
                <div><strong>寄件人:</strong> {selectedMail.from}</div>
                <div><strong>收件人:</strong> {selectedMail.to}</div>
                <div><strong>日期:</strong> {new Date(selectedMail.createdAt).toLocaleString()}</div>
              </div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                {selectedMail.body}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="page-title">收件匣</h2>
              {inbox.length > 0 ? (
                <p>請在左側選擇一封郵件或建立新郵件</p>
              ) : (
                <p>目前沒有郵件</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MailPage;