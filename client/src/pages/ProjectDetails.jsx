import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProjectDetails, addNote, addMessage } from '../api/project';

function ProjectDetails() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    loadProject();
    // eslint-disable-next-line
  }, [id]);

  const loadProject = async () => {
    try {
      const data = await getProjectDetails(id, token);
      setProject(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async () => {
    try {
      await addNote(id, noteContent, token);
      alert('備註已新增');
      setNoteContent('');
      loadProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMessage = async () => {
    try {
      await addMessage(id, messageContent, token);
      alert('訊息已新增');
      setMessageContent('');
      loadProject();
    } catch (err) {
      console.error(err);
    }
  };

  if (!project) return <div style={{ padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>專案詳細</h2>
      <p>客戶名稱：{project.clientName}</p>
      <p>專案名稱：{project.projectName}</p>
      <p>負責人：{project.owner?.username || 'N/A'}</p>
      <p>
        期間：
        {project.period?.startDate
          ? new Date(project.period.startDate).toLocaleDateString()
          : ''}{' '}
        ~{' '}
        {project.period?.endDate
          ? new Date(project.period.endDate).toLocaleDateString()
          : ''}
      </p>

      {/* 備註 */}
      <h3>備註 (Notes)</h3>
      <ul>
        {project.notes?.map((note) => (
          <li key={note._id}>
            {note.content} <small>({new Date(note.createdAt).toLocaleString()})</small>
          </li>
        ))}
      </ul>
      <input
        placeholder="輸入備註"
        value={noteContent}
        onChange={(e) => setNoteContent(e.target.value)}
      />
      <button onClick={handleAddNote}>新增備註</button>

      {/* 溝通訊息 */}
      <h3>溝通記錄 (Messages)</h3>
      <ul>
        {project.messages?.map((msg) => (
          <li key={msg._id}>
            {msg.message} <small>({new Date(msg.createdAt).toLocaleString()})</small>
          </li>
        ))}
      </ul>
      <input
        placeholder="輸入訊息"
        value={messageContent}
        onChange={(e) => setMessageContent(e.target.value)}
      />
      <button onClick={handleAddMessage}>新增訊息</button>

      {/* 進度 (tasks) */}
      <h3>進度 (Tasks)</h3>
      <ul>
        {project.tasks?.map((task, index) => (
          <li key={index}>
            {task.name} - {task.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProjectDetails;
