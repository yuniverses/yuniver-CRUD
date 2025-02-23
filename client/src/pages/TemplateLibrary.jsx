// src/pages/TemplateLibrary.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TemplateLibrary = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
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

  // 下載模板：將模板 JSON 內容輸出為檔案，同時附上 name 欄位
  const handleDownloadTemplate = (template) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
    const anchor = document.createElement('a');
    anchor.href = dataStr;
    anchor.download = `${template.name}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  // 套用模板：將模板的 flowChart 存入 localStorage，並導向新流程圖編輯器（new 模式）
  const handleApplyTemplate = (template) => {
    localStorage.setItem('appliedTemplate', JSON.stringify(template.flowChart));
    navigate('/flowchart-editor/new');
  };

  // 編輯模板：導向模板模式的流程圖編輯器，URL 格式： /flowchart-editor/template_{templateId}
  const handleEditTemplate = (template) => {
    navigate(`/flowchart-editor/template_${template._id}`);
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

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // 上傳模板：讀取 JSON 檔後呼叫 POST /api/templates 建立新模板
  const handleImportTemplate = () => {
    if (!selectedFile) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        // 預期 JSON 至少包含 name, description, flowChart 欄位
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
    reader.readAsText(selectedFile);
  };

  return (
    <div>
      <h2>Template Library</h2>
      <div style={{ marginBottom: "10px" }}>
        <label>
          Import Template:
          <input type="file" accept=".json" onChange={handleFileChange} style={{ marginLeft: "5px" }} />
        </label>
        <button onClick={handleImportTemplate} style={{ marginLeft: "10px" }}>Import Template</button>
      </div>
      {templates.length === 0 ? (
        <p>No templates available.</p>
      ) : (
        templates.map(template => (
          <div key={template._id} style={{ border: "1px solid #ccc", padding: "10px", margin: "10px 0" }}>
            <h3>{template.name}</h3>
            <p>{template.description}</p>
            {/* 這裡簡單以 pre 呈現 JSON 預覽，可根據需要改為視覺化預覽 */}
            <pre style={{ backgroundColor: "#f8f8f8", padding: "5px", maxHeight: "150px", overflow: "auto" }}>
              {JSON.stringify(template.flowChart, null, 2)}
            </pre>
            <button onClick={() => handleDownloadTemplate(template)}>Download</button>
            {/* <button onClick={() => handleApplyTemplate(template)} style={{ marginLeft: "10px" }}>Apply</button> */}
            <button onClick={() => handleEditTemplate(template)} style={{ marginLeft: "10px" }}>Edit</button>
            <button onClick={() => handleDeleteTemplate(template._id)} style={{ marginLeft: "10px" }}>Delete</button>
          </div>
        ))
      )}
    </div>
  );
};

export default TemplateLibrary;
