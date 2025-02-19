// components/ProjectList.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function ProjectList() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('http://localhost:5000/api/projects', {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => setProjects(res.data))
    .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h2>案件清單</h2>
      <ul>
        {projects.map((proj) => (
          <li key={proj._id}>
            {proj.clientName} - {proj.projectName}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProjectList;
