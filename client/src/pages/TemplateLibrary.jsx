// src/pages/TemplateLibrary.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TemplateLibrary = () => {
  const [templates, setTemplates] = useState([]);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [editingData, setEditingData] = useState({ name: '', description: '', flowChart: [] });
  const token = localStorage.getItem('token');
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
  const navigate = useNavigate();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get(`${API_URL}/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(res.data);
    } catch (error) {
      console.error('Failed to fetch templates', error);
    }
  };

  const handleDownloadTemplate = (template) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
    const anchor = document.createElement('a');
    anchor.href = dataStr;
    anchor.download = `${template.name}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleApplyTemplate = (template) => {
    // 儲存模板 flowChart 到 localStorage 並導向流程圖編輯器（例如 /flowchart-editor/new）
    localStorage.setItem('appliedTemplate', JSON.stringify(template.flowChart));
    navigate('/flowchart-editor/new');
  };

  const handleEditTemplate = (template) => {
    setEditingTemplateId(template._id);
    setEditingData({ name: template.name, description: template.description, flowChart: template.flowChart });
  };

  const handleSaveTemplate = async () => {
    try {
      await axios.put(`${API_URL}/templates/${editingTemplateId}`, editingData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingTemplateId(null);
      fetchTemplates();
      alert("Template updated successfully!");
    } catch (error) {
      console.error("Failed to update template", error);
      alert("Update failed.");
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      await axios.delete(`${API_URL}/templates/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTemplates();
      alert("Template deleted successfully!");
    } catch (error) {
      console.error("Failed to delete template", error);
      alert("Delete failed.");
    }
  };

  // 處理上傳模板 JSON 檔案
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        // 呼叫 createTemplate API，預設從上傳的 JSON 檔案中取得 name, description, flowChart
        axios.post(`${API_URL}/templates`, json, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(() => {
          fetchTemplates();
          alert("Template imported successfully!");
        }).catch(err => {
          console.error(err);
          alert("Import failed");
        });
      } catch (error) {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <h2>Template Library</h2>
      <div>
        <label>
          Import Template:
          <input type="file" accept=".json" onChange={handleFileChange} style={{ marginLeft: "5px" }} />
        </label>
      </div>
      {editingTemplateId ? (
        <div style={{ border: "1px solid #ccc", padding: "10px", marginTop: "20px" }}>
          <h3>Edit Template</h3>
          <div>
            <label>Name:</label>
            <input
              type="text"
              value={editingData.name}
              onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
            />
          </div>
          <div>
            <label>Description:</label>
            <textarea
              value={editingData.description}
              onChange={(e) => setEditingData({ ...editingData, description: e.target.value })}
            />
          </div>
          <div>
            <label>FlowChart JSON:</label>
            <textarea
              value={JSON.stringify(editingData.flowChart, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setEditingData({ ...editingData, flowChart: parsed });
                } catch (error) {
                  // 若解析失敗，不更新
                }
              }}
              rows="10"
              style={{ width: "100%" }}
            />
          </div>
          <button onClick={handleSaveTemplate}>Save Template</button>
          <button onClick={() => setEditingTemplateId(null)} style={{ marginLeft: "10px" }}>Cancel</button>
        </div>
      ) : (
        <div>
          {templates.map(template => (
            <div key={template._id} style={{ border: "1px solid #ccc", padding: "10px", margin: "10px 0" }}>
              <h3>{template.name}</h3>
              <p>{template.description}</p>
              <pre style={{ backgroundColor: "#f8f8f8", padding: "5px", maxHeight: "150px", overflow: "auto" }}>
                {JSON.stringify(template.flowChart, null, 2)}
              </pre>
              <button onClick={() => handleDownloadTemplate(template)}>Download</button>
              <button onClick={() => handleApplyTemplate(template)} style={{ marginLeft: "10px" }}>Apply</button>
              <button onClick={() => handleEditTemplate(template)} style={{ marginLeft: "10px" }}>Edit</button>
              <button onClick={() => handleDeleteTemplate(template._id)} style={{ marginLeft: "10px" }}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateLibrary;
