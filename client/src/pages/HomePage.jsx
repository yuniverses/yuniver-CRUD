import React from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* 左側選單 */}
      <div style={{ width: '200px', background: '#f5f5f5', padding: '20px' }}>
        <h3>YUNIVER</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>
            <Link to="/mail">Mail</Link>
          </li>
          <li>
            <Link to="/internal-files">內部檔案</Link>
          </li>
          <li>
            <Link to="/projects">專案列表</Link>
          </li>
          <li>
            <Link to="/project-manager">專案管理</Link>
          </li>
          <li>
            <Link to="/quotation">報價單</Link>
          </li>
          <li>
            <button onClick={handleLogout}>登出</button>
          </li>
        </ul>
      </div>

      {/* 右側主內容區 */}
      <div style={{ flex: 1, padding: '20px' }}>
        <h2>首頁 (Dashboard)</h2>
        <p>這裡可以放一些系統總覽、公告、或最新專案更新等。</p>
      </div>
    </div>
  );
}

export default HomePage;
