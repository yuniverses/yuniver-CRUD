import React, { useEffect, useState } from 'react';
import { fetchAllProjects } from '../api/project';
import { Link } from 'react-router-dom';

function ProjectList() {
  const [projects, setProjects] = useState([]);
  const token = localStorage.getItem('token');

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

  return (
    <div style={{ padding: '20px' }}>
      <h2>專案列表</h2>
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
          {projects.map((proj) => (
            <tr key={proj._id}>
              <td>{proj.clientName}</td>
              <td>{proj.projectName}</td>
              <td>{proj.owner?.username || 'N/A'}</td>
              <td>
                {proj.period?.startDate
                  ? new Date(proj.period.startDate).toLocaleDateString()
                  : ''} ~{' '}
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
    </div>
  );
}

export default ProjectList;
