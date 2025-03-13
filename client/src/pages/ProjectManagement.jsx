// src/pages/ProjectManagement.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { fetchAllProjects } from '../api/project';
import { useNavigate } from "react-router-dom";

const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [taskFilter, setTaskFilter] = useState('all'); // 'all' or 'inProgress'
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
        // 過濾專案：若用戶角色非 god/admin，則僅顯示 accessControl 陣列中包含當前用戶 id 的專案
        const authorized = data.filter((proj) => {
          if (user.role === 'god' || user.role === 'admin') {
            return true;
          }
          if (proj.accessControl && Array.isArray(proj.accessControl)) {
            return proj.accessControl.some((item) => String(item.user) === String(user.id));
          }
          return false;
        });
        
        setProjects(authorized);
        setFilteredProjects(authorized);
      } catch (err) {
        console.error("Failed to load projects:", err);
      }
    };
    loadProjects();
  }, [token, user.id, user.role]);

  // 過濾進行中任務
  const filterInProgressTasks = () => {
    setTaskFilter('inProgress');
    
    // Apply both permission and task filters
    const filtered = projects.filter(project => {
      // First check permission (already handled in the useEffect)
      return true; // All projects in the 'projects' state are already filtered by permission
    });
    
    setFilteredProjects(filtered);
  };

  // 顯示所有任務
  const showAllTasks = () => {
    setTaskFilter('all');
    setFilteredProjects(projects); // Reset to permission-filtered projects
  };

  // 更新某個專案的 flowChart 屬性（更新完後前端同步）
  const updateProjectFlowchart = (projectId, newFlowChart) => {
    setProjects(prevProjects =>
      prevProjects.map(p =>
        (p._id === projectId || p.id === projectId)
          ? { ...p, flowChart: newFlowChart }
          : p
      )
    );
    
    setFilteredProjects(prevProjects =>
      prevProjects.map(p =>
        (p._id === projectId || p.id === projectId)
          ? { ...p, flowChart: newFlowChart }
          : p
      )
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>專案管理</h1>
      {user.role && (
        <p>當前用戶角色: {user.role}</p>
      )}
      <div style={{ marginBottom: "20px" }}>
        <button 
          onClick={filterInProgressTasks}
          style={{ 
            marginRight: "10px", 
            padding: "8px 16px",
            backgroundColor: taskFilter === 'inProgress' ? "#4CAF50" : "#f1f1f1",
            color: taskFilter === 'inProgress' ? "white" : "black",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          顯示狀態進行中項目
        </button>
        <button 
          onClick={showAllTasks}
          style={{ 
            padding: "8px 16px",
            backgroundColor: taskFilter === 'all' ? "#4CAF50" : "#f1f1f1",
            color: taskFilter === 'all' ? "white" : "black",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          顯示所有
        </button>
      </div>
      {filteredProjects.length === 0 ? (
        <p>您沒有權限查看任何專案，或目前沒有專案。</p>
      ) : (
        filteredProjects.map(project => (
            <ProjectFlowchartEditor
              project={project}
              token={token}
              updateProjectFlowchart={updateProjectFlowchart}
              taskFilter={taskFilter}
            />
        ))
      )}
    </div>
  );
};

const ProjectFlowchartEditor = ({ project, token, updateProjectFlowchart, taskFilter }) => {
  // 為每個專案建立局部狀態存放 flowChart 節點
  const [nodes, setNodes] = useState(project.flowChart || []);
  // 用來控制 Phase 的展開／摺疊狀態（key 為 Phase 的 id）
  const [collapsedPhases, setCollapsedPhases] = useState({});
  // 過濾後的節點
  const filteredNodes = taskFilter === 'all' 
    ? nodes 
    : nodes.filter(node => 
        node.type === 'phase' || 
        (node.type === 'task' && node.status === '進行中')
      );

  // 更新節點內容
  const updateNode = (nodeId, field, value) => {
    setNodes(prevNodes =>
      prevNodes.map(n => (n.id === nodeId ? { ...n, [field]: value } : n))
    );
  };

  // 切換 Phase 展開／摺疊
  const toggleCollapse = (phaseId) => {
    setCollapsedPhases(prev => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
  };

  // 移動 Phase 排序（上下箭頭）
  const movePhase = (phaseId, direction) => {
    setNodes(prevNodes => {
      const phases = prevNodes.filter(n => n.type === 'phase');
      const others = prevNodes.filter(n => n.type !== 'phase');
      const index = phases.findIndex(p => p.id === phaseId);
      if (index === -1) return prevNodes;
      const newIndex = index + (direction === 'up' ? -1 : 1);
      if (newIndex < 0 || newIndex >= phases.length) return prevNodes;
      [phases[index], phases[newIndex]] = [phases[newIndex], phases[index]];
      return [...phases, ...others];
    });
  };

  // 移動 Task 排序（僅針對屬於同一 Phase 的 Task）
  const moveTask = (taskId, phaseId, direction) => {
    setNodes(prevNodes => {
      const tasks = prevNodes.filter(n => n.type === 'task' && String(n.containerId) === String(phaseId));
      const others = prevNodes.filter(n => !(n.type === 'task' && String(n.containerId) === String(phaseId)));
      const index = tasks.findIndex(t => t.id === taskId);
      if (index === -1) return prevNodes;
      const newIndex = index + (direction === 'up' ? -1 : 1);
      if (newIndex < 0 || newIndex >= tasks.length) return prevNodes;
      [tasks[index], tasks[newIndex]] = [tasks[newIndex], tasks[index]];
      return [...others, ...tasks];
    });
  };

  // 送出更新後的 flowChart 至後端 API
  const handleSaveFlowChart = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const projectId = project._id || project.id;
      const response = await axios.put(
        `${API_URL}/projects/${projectId}/flowchart`,
        { flowChart: nodes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Flowchart updated successfully!");
      updateProjectFlowchart(projectId, nodes);
    } catch (error) {
      console.error("Failed to update flowchart:", error);
      alert("Save failed.");
    }
  };

  // 以表格呈現 List View
  const renderListView = () => {
    const phases = filteredNodes.filter(n => n.type === "phase");
    const tasks = filteredNodes.filter(n => n.type === "task");
    const unassignedTasks = tasks.filter(task => !task.containerId);

    // 顯示進行中任務時檢查該 Phase 下是否有進行中的任務
    const phaseHasVisibleTasks = (phaseId) => {
      if (taskFilter === 'all') return true;
      
      return nodes.some(node => 
        node.type === 'task' && 
        String(node.containerId) === String(phaseId) && 
        node.status === '進行中'
      );
    };
    console.log(project);

    return (
      <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#ddd" }}>
            <th>Type</th>
            <th>Label</th>
            <th>Description</th>
            <th>Link</th>
            <th>Status</th>
            <th>排序</th>
            <th>Show in Flowchart</th>
          </tr>
        </thead>
        <tbody>
          {phases.map(phase => (
            <React.Fragment key={phase.id}>
              {/* 只有在 phase 下有可見的任務時才顯示該 phase，或者在顯示所有時 */}
              {(taskFilter === 'all' || phaseHasVisibleTasks(phase.id)) && (
                <tr style={{ backgroundColor: "#f0f0f0" }}>
                  <td>
                    <span onClick={() => toggleCollapse(phase.id)} style={{ cursor: "pointer", marginRight: "5px" }}>
                      {collapsedPhases[phase.id] ? "△" : "▽"}
                    </span>
                    Phase
                  </td>
                  <td>
                    <input
                      type="text"
                      value={phase.label}
                      onChange={(e) => updateNode(phase.id, "label", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={phase.description}
                      onChange={(e) => updateNode(phase.id, "description", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={phase.link || ""}
                      onChange={(e) => updateNode(phase.id, "link", e.target.value)}
                    />
                  </td>
                  <td>
                    <select
                      value={phase.status}
                      onChange={(e) => updateNode(phase.id, "status", e.target.value)}
                    >
                      <option value="未開始">未開始</option>
                      <option value="規劃中">規劃中</option>
                      <option value="進行中">進行中</option>
                      <option value="已完成">已完成</option>
                      <option value="自訂">自訂</option>
                    </select>
                  </td>
                  <td>
                    <button onClick={() => movePhase(phase.id, "up")}>↑</button>
                    <button onClick={() => movePhase(phase.id, "down")}>↓</button>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={phase.showInFlowchart !== false}
                      onChange={(e) => updateNode(phase.id, "showInFlowchart", e.target.checked)}
                    />
                  </td>
                </tr>
              )}
              {!collapsedPhases[phase.id] && (taskFilter === 'all' || phaseHasVisibleTasks(phase.id)) &&
                nodes // 注意這裡使用 nodes 而不是 filteredNodes 來確保我們獲取所有節點
                  .filter(task => 
                    task.type === 'task' && 
                    String(task.containerId) === String(phase.id) && 
                    (taskFilter === 'all' || task.status === '進行中')
                  )
                  .map(task => (
                    <tr key={task.id}>
                      <td style={{ paddingLeft: "20px" }}>Task</td>
                      <td>
                        <input
                          type="text"
                          value={task.label}
                          onChange={(e) => updateNode(task.id, "label", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={task.description}
                          onChange={(e) => updateNode(task.id, "description", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={task.link || ""}
                          onChange={(e) => updateNode(task.id, "link", e.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          value={task.status}
                          onChange={(e) => updateNode(task.id, "status", e.target.value)}
                        >
                          <option value="未開始">未開始</option>
                          <option value="規劃中">規劃中</option>
                          <option value="進行中">進行中</option>
                          <option value="已完成">已完成</option>
                          <option value="自訂">自訂</option>
                        </select>
                      </td>
                      <td>
                        <button onClick={() => moveTask(task.id, phase.id, "up")}>↑</button>
                        <button onClick={() => moveTask(task.id, phase.id, "down")}>↓</button>
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={task.showInFlowchart !== false}
                          onChange={(e) => updateNode(task.id, "showInFlowchart", e.target.checked)}
                        />
                      </td>
                    </tr>
                  ))}
            </React.Fragment>
          ))}
          {unassignedTasks.length > 0 && (
            <>
              <tr>
                <td colSpan="7" style={{ backgroundColor: "#ccc", fontWeight: "bold" }}>
                  Unassigned Tasks
                </td>
              </tr>
              {unassignedTasks.map(task => (
                <tr key={task.id}>
                  <td>Task</td>
                  <td>
                    <input
                      type="text"
                      value={task.label}
                      onChange={(e) => updateNode(task.id, "label", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={task.description}
                      onChange={(e) => updateNode(task.id, "description", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={task.link || ""}
                      onChange={(e) => updateNode(task.id, "link", e.target.value)}
                    />
                  </td>
                  <td>
                    <select
                      value={task.status}
                      onChange={(e) => updateNode(task.id, "status", e.target.value)}
                    >
                      <option value="未開始">未開始</option>
                      <option value="規劃中">規劃中</option>
                      <option value="進行中">進行中</option>
                      <option value="已完成">已完成</option>
                      <option value="自訂">自訂</option>
                    </select>
                  </td>
                  <td>{/* 排序可依需求增加 */}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={task.showInFlowchart !== false}
                      onChange={(e) => updateNode(task.id, "showInFlowchart", e.target.checked)}
                    />
                  </td>
                </tr>
              ))}
            </>
          )}
        </tbody>
        <p>
            客戶名稱: {project.clientName} <br/>
            負責人: {project.owner?.username || "N/A"}<br/>
            期間: {project.period?.startDate ? new Date(project.period.startDate).toLocaleDateString() : ""}
              {" ~ "}
              {project.period?.endDate ? new Date(project.period.endDate).toLocaleDateString() : ""}
            </p>
      </table>
    );
  };
  const navigate = useNavigate();
  return (
    <div style={{ marginTop: "10px", border: "1px solid #aaa", padding: "10px" }}>
      
      <button onClick={() => navigate(`/projects/${project._id}`)}><h3>{project.projectName}</h3></button>

      {renderListView()}
      <button onClick={handleSaveFlowChart} style={{ marginTop: "10px" }}>Save Flowchart</button>
    </div>
  );
};

export default ProjectManagement;