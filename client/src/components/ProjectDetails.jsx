// components/ProjectDetails.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

function ProjectDetails() {
  const { id } = useParams();
  const [project, setProject] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`http://localhost:5000/api/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => setProject(res.data))
    .catch(err => console.error(err));
  }, [id]);

  if (!project) return <div>載入中...</div>;

  return (
    <div>
      <h2>專案詳細資訊</h2>
      <p>客戶名稱：{project.clientName}</p>
      <p>專案名稱：{project.projectName}</p>
      {/* 備註區 */}
      <div>
        <h3>備註（便條紙）</h3>
        {project.notes.map((note) => (
          <div key={note._id} style={{ border: '1px solid #ccc', margin: '5px', padding: '5px' }}>
            {note.content}
          </div>
        ))}
      </div>
      {/* 溝通訊息 */}
      <div>
        <h3>溝通記錄</h3>
        {project.messages.map((msg) => (
          <div key={msg._id}>
            {msg.message} (於 {new Date(msg.createdAt).toLocaleString()})
          </div>
        ))}
      </div>
      {/* 進度管理 */}
      <div>
        <h3>進度</h3>
        {project.tasks.map(task => (
          <div key={task._id}>
            {task.name} - {task.status}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProjectDetails;
