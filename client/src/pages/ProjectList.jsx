// client/src/pages/ProjectList.jsx
import React, { useEffect, useState } from 'react';
import { fetchAllProjects } from '../api/project';
import { Link } from 'react-router-dom';

function ProjectList() {
  const [projects, setProjects] = useState([]);
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

  return (
    <div style={{ padding: '20px' }}>
      <h2>專案列表</h2>
      {filteredProjects.length > 0 ? (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>客戶名稱</th>
              <th>專案名稱</th>
              <th>負責人</th>
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
                  {proj.period?.startDate
                    ? new Date(proj.period.startDate).toLocaleDateString()
                    : ''}{' '}
                  ~{' '}
                  {proj.period?.endDate
                    ? new Date(proj.period.endDate).toLocaleDateString()
                    : ''}
                </td>
                <td>
                  <Link to={`/projects/${proj._id}`}>查看</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>您沒有權限查看任何專案。</p>
      )}
    </div>
  );
}

export default ProjectList;
