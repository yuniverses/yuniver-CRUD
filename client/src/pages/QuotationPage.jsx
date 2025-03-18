import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import "../css/shared-layout.css";
import html2pdf from 'html2pdf.js';

function QuotationPage() {
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    { type: 'design', name: '', description: '', price: 0 }
  ]);
  const [timeValues, setTimeValues] = useState({
    startDate: new Date().toISOString().split('T')[0],
    midDate: '',
    endDate: ''
  });
  const [customFields, setCustomFields] = useState([
    { title: '', content: '' }
  ]);
  const [activeTab, setActiveTab] = useState("quotation");
  const quotationRef = useRef();

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
      // 設定PDF選項
      const options = {
        margin: 10,
        filename: `${clientName || 'YUNIVER'}-報價單.pdf`,
        image: { type: 'jpeg', quality: 0.99 },
        html2canvas: { scale: 3, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // 直接使用html2pdf轉換DOM元素為PDF
      html2pdf().from(quotationRef.current).set(options).save();
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
    setItems([...items, { type: 'design', name: '', description: '', price: 0 }]);
  };

  const removeItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  // 計算總金額
  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  };

  const handleTimeChange = (field, value) => {
    setTimeValues({
      ...timeValues,
      [field]: value
    });
  };
  
  const handleCustomFieldChange = (index, field, value) => {
    const newCustomFields = [...customFields];
    newCustomFields[index][field] = value;
    setCustomFields(newCustomFields);
  };
  
  const addCustomField = () => {
    setCustomFields([...customFields, { title: '', content: '' }]);
  };
  
  const removeCustomField = (index) => {
    const newCustomFields = [...customFields];
    newCustomFields.splice(index, 1);
    setCustomFields(newCustomFields);
  };

  // 轉換項目類型為中文顯示
  const getTypeDisplay = (type) => {
    switch(type.toLowerCase()) {
      case 'design': return '設計';
      case 'develop': return '開發';
      case 'maintenance': return '維護';
      case 'consulting': return '顧問';
      case 'other': return '其他';
      default: return type;
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
        <div className="main-content" style={{ background: "linear-gradient(180deg,rgb(238, 238, 238) 0%, #FFF 50%)" }}>
          
          <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 100px)", minHeight: "297mm" }}>
            {/* 報價單預覽 - 這部分將被轉換為PDF */}
            <div 
              ref={quotationRef} 
              style={{ 
                backgroundColor: "#fff",
                padding: "30px", 
                borderRadius: "4px",
                marginBottom: "20px",
               width: "calc(100% - 60px)",
                margin: "0 auto 30px auto",
                flex: "1 1 auto",
  
                fontFamily: "'Roboto', sans-serif"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
                <div>
                  <div style={{ fontSize: "32px", fontWeight: "bold", letterSpacing: "2px" }}>
                    YUNIVER <span style={{ fontSize: "14px", verticalAlign: "super", marginLeft: "3px" }}>®</span>
                  </div>
                  <div style={{ marginTop: "15px" }}>
                    <p style={{ margin: "3px 0", fontSize: "13px" }}>Guanyu Chen</p>
                    <p style={{ margin: "3px 0", fontSize: "13px" }}>https://yuniverses.com/</p>
                    <p style={{ margin: "3px 0", fontSize: "13px" }}>(+81) 070 3349 0711</p>
                    <p style={{ margin: "3px 0", fontSize: "13px" }}>guanyu@yuniverses.com</p>
                  </div>
                </div>
                <div style={{ border: "1px solid black", padding: "3px 8px", fontSize: "12px" }}>quotation</div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <div style={{ fontSize: "13px", marginBottom: "3px" }}>For :</div>
                <div style={{ fontSize: "20px", marginBottom: "15px" }}>{clientName || '客戶名稱'}</div>
              </div>
              
              <div style={{ width: "100%", height: "1px", backgroundColor: "#000", margin: "15px 0" }}></div>
              
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                <div>
                  <div style={{ fontSize: "13px", marginBottom: "3px" }}>Subject :</div>
                  <div style={{ fontSize: "20px" }}>{subject || projectName || '專案名稱'}</div>
                </div>
                <div style={{ fontSize: "13px", textAlign: "right" }}>{date}</div>
              </div>
              
              <div style={{ width: "100%", height: "1px", backgroundColor: "#000", margin: "15px 0" }}></div>
              
              <div style={{ marginBottom: "15px" }}>
                <div style={{ fontSize: "13px", marginBottom: "3px" }}>專案區間 :</div>
                <div style={{ display: "flex", gap: "60px" }}>
                  <div style={{ fontSize: "13px" }}>{timeValues.startDate}</div>
                  <div style={{ fontSize: "13px" }}>{timeValues.midDate}</div>
                  <div style={{ fontSize: "13px" }}>{timeValues.endDate}</div>
                </div>
              </div>
              
              {customFields.some(field => field.title || field.content) && (
                <>
                  <div style={{ width: "100%", height: "1px", backgroundColor: "#000", margin: "15px 0" }}></div>
                  
                  {customFields.map((field, idx) => (
                    field.title || field.content ? (
                      <div key={idx} style={{ marginBottom: "15px" }}>
                        {field.title && (
                          <div style={{ fontSize: "13px", marginBottom: "3px" }}>{field.title} :</div>
                        )}
                        {field.content && (
                          <div style={{ fontSize: "15px" }}>{field.content}</div>
                        )}
                      </div>
                    ) : null
                  ))}
                </>
              )}
              
              <div style={{ width: "100%", height: "1px", backgroundColor: "#000", margin: "15px 0" }}></div>
              
              <table style={{ width: "100%", borderCollapse: "collapse", margin: "15px 0" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px 0", fontSize: "13px", fontWeight: "normal", borderBottom: "1px solid #000" }}>類型</th>
                    <th style={{ textAlign: "left", padding: "8px 0", fontSize: "13px", fontWeight: "normal", borderBottom: "1px solid #000" }}>項目</th>
                    <th style={{ textAlign: "left", padding: "8px 0", fontSize: "13px", fontWeight: "normal", borderBottom: "1px solid #000" }}>描述</th>
                    <th style={{ textAlign: "right", padding: "8px 0", fontSize: "13px", fontWeight: "normal", borderBottom: "1px solid #000" }}>價格 (新台幣)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: "12px 0", fontSize: "13px", borderBottom: "1px solid #eee" }}>{getTypeDisplay(item.type)}</td>
                      <td style={{ padding: "12px 0", fontSize: "13px", borderBottom: "1px solid #eee" }}>{item.name}</td>
                      <td style={{ padding: "12px 0", fontSize: "13px", borderBottom: "1px solid #eee" }}>{item.description}</td>
                      <td style={{ padding: "12px 0", fontSize: "13px", borderBottom: "1px solid #eee", textAlign: "right" }}>
                        ${parseFloat(item.price).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "30px", fontSize: "15px", fontWeight: "bold" }}>
                <div style={{ marginRight: "10px" }}>總價：</div>
                <div>${calculateTotal().toLocaleString()}</div>
              </div>
              
              {notes && (
                <div style={{ fontSize: "12px", textAlign: "right", marginTop: "5px" }}>
                  {notes}
                </div>
              )}
              
              <div style={{ width: "100%", height: "1px", backgroundColor: "#000", margin: "15px 0" }}></div>
              
              <div style={{ marginTop: "60px", borderTop: "2px solid #000" }}></div>
            </div>
            
            <div style={{ flex: "0 0 auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ marginTop: "30px", marginBottom: "15px", fontSize: "18px" }}>報價單資訊</h3>
                <button 
                  onClick={handleDownloadPDF} 
                  className="yuniver-btn"
                  disabled={!clientName || !projectName || items.some(item => !item.name || !item.description)}
                >
                  產生並下載 PDF
                </button>
              </div>
              
              {/* 基本資訊表單 */}
              <div style={{ 
                backgroundColor: "#f9f9f9", 
                padding: "20px", 
                borderRadius: "4px",
                border: "1px solid #e0e0e0",
                marginBottom: "20px"
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  <div>
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
                  
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>Subject：</label>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                      placeholder="請輸入主題（若空白則使用專案名稱）"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>日期：</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                    />
                  </div>
                </div>
                
                <div style={{ marginTop: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>時間區間：</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "5px", fontSize: "12px" }}>開始日期：</label>
                      <input
                        type="date"
                        value={timeValues.startDate}
                        onChange={(e) => handleTimeChange('startDate', e.target.value)}
                        style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "5px", fontSize: "12px" }}>中間日期：</label>
                      <input
                        type="date"
                        value={timeValues.midDate}
                        onChange={(e) => handleTimeChange('midDate', e.target.value)}
                        style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "5px", fontSize: "12px" }}>結束日期：</label>
                      <input
                        type="date"
                        value={timeValues.endDate}
                        onChange={(e) => handleTimeChange('endDate', e.target.value)}
                        style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                      />
                    </div>
                  </div>
                </div>
                
                <div style={{ marginTop: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>備註：</label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                    placeholder="例如：含一年維護費用"
                  />
                </div>
                
                <div style={{ marginTop: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>自訂欄位：</label>
                    <button 
                      onClick={addCustomField} 
                      className="yuniver-btn secondary" 
                      style={{ padding: "5px 10px", fontSize: "12px" }}
                    >
                      新增自訂欄位
                    </button>
                  </div>
                  
                  {customFields.map((field, idx) => (
                    <div key={idx} style={{ 
                      display: "grid", 
                      gridTemplateColumns: "1fr 3fr auto", 
                      gap: "10px", 
                      marginTop: "10px",
                      padding: "10px",
                      backgroundColor: "#f2f2f2",
                      borderRadius: "4px"
                    }}>
                      <div>
                        <input
                          value={field.title}
                          onChange={(e) => handleCustomFieldChange(idx, 'title', e.target.value)}
                          style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                          placeholder="標題"
                        />
                      </div>
                      <div>
                        <input
                          value={field.content}
                          onChange={(e) => handleCustomFieldChange(idx, 'content', e.target.value)}
                          style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                          placeholder="內容"
                        />
                      </div>
                      <div>
                        <button 
                          onClick={() => removeCustomField(idx)} 
                          className="yuniver-btn danger"
                          style={{ padding: "5px 10px", fontSize: "12px" }}
                          disabled={customFields.length <= 1}
                        >
                          移除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <h3 style={{ marginTop: "30px", marginBottom: "15px", fontSize: "18px" }}>項目列表</h3>
              <table className="yuniver-table">
                <thead>
                  <tr>
                    <th style={{ width: "15%" }}>類型</th>
                    <th style={{ width: "20%" }}>項目名稱</th>
                    <th style={{ width: "35%" }}>描述</th>
                    <th style={{ width: "20%" }}>費用 (NT$)</th>
                    <th style={{ width: "10%" }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <select
                          value={item.type}
                          onChange={(e) => handleItemChange(idx, 'type', e.target.value)}
                          style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                        >
                          <option value="design">設計</option>
                          <option value="develop">開發</option>
                          <option value="maintenance">維護</option>
                          <option value="consulting">顧問</option>
                          <option value="other">其他</option>
                        </select>
                      </td>
                      <td>
                        <input
                          value={item.name}
                          onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                          style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                          placeholder="項目名稱"
                        />
                      </td>
                      <td>
                        <input
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
                          placeholder="項目描述"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
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
                    <td colSpan="5" style={{ textAlign: "center" }}>
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
                    <td colSpan="3" style={{ textAlign: "right", fontWeight: "bold" }}>總計：</td>
                    <td style={{ fontWeight: "bold" }}>NT$ {calculateTotal().toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuotationPage;