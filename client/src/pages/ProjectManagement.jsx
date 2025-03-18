// src/pages/ProjectManagement.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { fetchAllProjects } from '../api/project';
import { Link, useNavigate } from "react-router-dom";
import "../css/shared-layout.css";
import "../css/custom-communication.css";

const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [taskFilter, setTaskFilter] = useState('all'); // 'all' or 'inProgress'
  const [activeTab, setActiveTab] = useState("projectmanagement");
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

  // 簡單權限檢查函式，檢查當前角色是否在允許列表中
  const hasAccess = (role, allowedRoles) => {
    return allowedRoles.includes(role);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

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
            {hasAccess(user.role, ["god", "admin", "employee"]) && (
              <li>
                <Link to="/mail">Mail</Link>
              </li>
            )}
            {/* 僅當用戶角色為 god 或 admin 時才顯示 */}
            {hasAccess(user.role, ["god", "admin", "employee"]) && (
              <li>
                <Link to="/internal-files">內部檔案</Link>
              </li>
            )}
            {/* 僅當用戶角色為 god 或 admin 時才顯示 */}
            {hasAccess(user.role, ["god", "admin"]) && (
              <li>
                <Link to="/project-manager">專案編輯與設定</Link>
              </li>
            )}
            {/* 僅當用戶角色為 god 或 admin 時才顯示 */}
            {hasAccess(user.role, ["god", "admin","employee"]) && (
              <li>
                <Link to="/ProjectManagement" className="active">專案管理ALL</Link>
              </li>
            )}
            {/* 僅當用戶角色為 god 或 admin 時才顯示 */}
            {hasAccess(user.role, ["god", "admin", "employee"]) && (
              <li>
                <Link to="/quotation">報價單</Link>
              </li>
            )}
            
            {/* 僅當用戶角色為 god 或 admin 時才顯示 */}
            {hasAccess(user.role, ["god", "admin"]) && (
              <li>
                <Link to="/usermanagement">身份管理</Link>
              </li>
            )}
          </ul>
        </div>

        {/* 右側主內容區 */}
        <div className="main-content">
          {/* <h2 className="page-title">專案管理</h2>
          
          {user.role && (
            <p style={{ marginBottom: "20px" }}>當前用戶角色: <strong>{user.role}</strong></p>
          )} */}
          
          <div style={{ marginBottom: "30px" }}>
            <button 
              onClick={filterInProgressTasks}
              className={`yuniver-btn yuniver-filter-btn ${taskFilter === 'inProgress' ? '' : 'secondary'}`}
            >
              顯示狀態進行中項目
            </button>
            <button 
              onClick={showAllTasks}
              className={`yuniver-btn yuniver-filter-btn ${taskFilter === 'all' ? '' : 'secondary'}`}
            >
              顯示所有
            </button>
          </div>
          
          {filteredProjects.length === 0 ? (
            <p className="no-data-message">您沒有權限查看任何專案，或目前沒有專案。</p>
          ) : (
            filteredProjects.map(project => (
              <ProjectFlowchartEditor
                key={project._id}
                project={project}
                token={token}
                updateProjectFlowchart={updateProjectFlowchart}
                taskFilter={taskFilter}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const ProjectFlowchartEditor = ({ project, token, updateProjectFlowchart, taskFilter }) => {
  // 為每個專案建立局部狀態存放 flowChart 節點
  const [nodes, setNodes] = useState(project.flowChart || []);
  // 用來控制 Phase 的展開／摺疊狀態（key 為 Phase 的 id）
  const [collapsedPhases, setCollapsedPhases] = useState({});
  // 記錄是否有更動過
  const [hasChanged, setHasChanged] = useState(false);
  // 彈窗控制
  const [showFlowchartModal, setShowFlowchartModal] = useState(false);
  // 過濾後的節點
  const filteredNodes = taskFilter === 'all' 
    ? nodes 
    : nodes.filter(node => 
        node.type === 'phase' || 
        (node.type === 'task' && node.status === '進行中')
      );

  // 更新節點內容
  const updateNode = (nodeId, field, value) => {
    setHasChanged(true);
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

  // 移動 Phase 排序（上下箭頭）- 支援巢狀結構
  const movePhase = (phaseId, direction) => {
    setHasChanged(true);
    setNodes(prevNodes => {
      // 找到目標 Phase
      const targetPhase = prevNodes.find(n => n.id === phaseId);
      if (!targetPhase) return prevNodes;
      
      // 獲取同一層級的 Phase 節點（相同的父節點）
      let siblingPhases = prevNodes.filter(n => 
        n.type === 'phase' && 
        String(n.containerId) === String(targetPhase.containerId)
      );
      
      // 對同層級的 Phases 添加排序屬性（如果沒有）
      siblingPhases = siblingPhases.map((phase, idx) => {
        if (phase.sortOrder === undefined) {
          return { ...phase, sortOrder: idx * 10 }; // 使用10的倍數方便插入
        }
        return phase;
      });
      
      // 根據排序屬性排序
      siblingPhases.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      
      // 找出目標 Phase 在排序後的陣列中的索引
      const index = siblingPhases.findIndex(p => p.id === phaseId);
      if (index === -1) return prevNodes;
      
      // 計算新索引
      const newIndex = index + (direction === 'up' ? -1 : 1);
      
      // 確保新索引在有效範圍內
      if (newIndex < 0 || newIndex >= siblingPhases.length) return prevNodes;
      
      // 獲取要交換的兩個元素
      const currentElement = siblingPhases[index];
      const swapElement = siblingPhases[newIndex];
      
      // 交換排序值
      const currentSortOrder = currentElement.sortOrder || index * 10;
      const swapSortOrder = swapElement.sortOrder || newIndex * 10;
      
      // 使用交換後的排序值創建更新的節點陣列
      return prevNodes.map(node => {
        if (node.id === currentElement.id) {
          return { ...node, sortOrder: swapSortOrder };
        } else if (node.id === swapElement.id) {
          return { ...node, sortOrder: currentSortOrder };
        }
        return node;
      });
    });
  }

  // 移動 Task 排序（僅針對屬於同一 Phase 的 Task）
  const moveTask = (taskId, phaseId, direction) => {
    setHasChanged(true);
    setNodes(prevNodes => {
      // 找到目標 Task
      const targetTask = prevNodes.find(n => n.id === taskId);
      if (!targetTask) return prevNodes;
      
      // 獲取同一 Phase 下的所有 Task 節點
      let siblingTasks = prevNodes.filter(n => 
        n.type === 'task' && 
        String(n.containerId) === String(phaseId)
      );
      
      // 對同一 Phase 下的 Tasks 添加排序屬性（如果沒有）
      siblingTasks = siblingTasks.map((task, idx) => {
        if (task.sortOrder === undefined) {
          return { ...task, sortOrder: idx * 10 }; // 使用10的倍數方便插入
        }
        return task;
      });
      
      // 根據排序屬性排序
      siblingTasks.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      
      // 找出目標 Task 在排序後的陣列中的索引
      const index = siblingTasks.findIndex(t => t.id === taskId);
      if (index === -1) return prevNodes;
      
      // 計算新索引
      const newIndex = index + (direction === 'up' ? -1 : 1);
      
      // 確保新索引在有效範圍內
      if (newIndex < 0 || newIndex >= siblingTasks.length) return prevNodes;
      
      // 獲取要交換的兩個元素
      const currentElement = siblingTasks[index];
      const swapElement = siblingTasks[newIndex];
      
      // 交換排序值
      const currentSortOrder = currentElement.sortOrder || index * 10;
      const swapSortOrder = swapElement.sortOrder || newIndex * 10;
      
      // 使用交換後的排序值創建更新的節點陣列
      return prevNodes.map(node => {
        if (node.id === currentElement.id) {
          return { ...node, sortOrder: swapSortOrder };
        } else if (node.id === swapElement.id) {
          return { ...node, sortOrder: currentSortOrder };
        }
        return node;
      });
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
      alert("流程圖已成功更新!");
      updateProjectFlowchart(projectId, nodes);
      setHasChanged(false);
    } catch (error) {
      console.error("Failed to update flowchart:", error);
      alert("儲存失敗.");
    }
  };

  // 以表格呈現 List View
  const renderListView = () => {
    // 取出未指定 container 的 Phase 節點（頂層 Phase），並按照排序屬性排序
    const topLevelPhases = [...filteredNodes.filter(n => n.type === "phase" && !n.containerId)]
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const tasks = filteredNodes.filter(n => n.type === "task");
    const unassignedTasks = tasks.filter(task => !task.containerId);
    // 其他未分類的元素（非Phase, 非Task, 且無容器）
    const unassignedOthers = filteredNodes.filter(n => 
      n.type !== "phase" && n.type !== "task" && 
      n.type !== "arrow" && !n.containerId
    );

    // 顯示進行中任務時檢查該 Phase 下是否有進行中的任務
    const phaseHasVisibleTasks = (phaseId) => {
      if (taskFilter === 'all') return true;
      
      return nodes.some(node => 
        (node.type === 'task' && 
         String(node.containerId) === String(phaseId) && 
         node.status === '進行中') ||
        // 檢查子 Phase 中是否有進行中的任務
        (node.type === 'phase' && 
         String(node.containerId) === String(phaseId) && 
         phaseHasVisibleTasks(node.id))
      );
    };

    // 遞迴渲染 Phase 及其子項目（包含巢狀 Phase）
    const renderPhaseWithChildren = (phase, indentLevel = 0) => {
      const paddingLeft = indentLevel * 20;
      const bgColor = indentLevel % 2 === 0 ? "" : "nested-phase";
      
      // 檢查是否需要顯示該 Phase
      if (taskFilter !== 'all' && !phaseHasVisibleTasks(phase.id)) {
        return null;
      }
      
      return (
        <React.Fragment key={phase.id}>
          <tr className={`phase-row status-${phase.status === "未開始" ? "pending" : phase.status === "規劃中" ? "planning" : phase.status === "進行中" ? "in-progress" : phase.status === "已完成" ? "completed" : "custom"} ${bgColor}`}>
            <td style={{ paddingLeft: `${paddingLeft}px` }}>
              <span onClick={() => toggleCollapse(phase.id)} className="yuniver-phase-toggle">
                {collapsedPhases[phase.id] ? "△" : "▽"}
              </span>
              Phase {indentLevel > 0 ? `(層級${indentLevel})` : ""}
            </td>
            <td>
              <input
                type="text"
                value={phase.label}
                onChange={(e) => updateNode(phase.id, "label", e.target.value)}
                className="form-control"
              />
            </td>
            <td>
              <input
                type="text"
                value={phase.description}
                onChange={(e) => updateNode(phase.id, "description", e.target.value)}
                className="form-control"
              />
            </td>
            <td>
              <input
                type="text"
                value={phase.link || ""}
                onChange={(e) => updateNode(phase.id, "link", e.target.value)}
                className="form-control"
              />
            </td>
            <td>
              <select
                value={phase.status}
                onChange={(e) => updateNode(phase.id, "status", e.target.value)}
                className="form-control"
              >
                <option value="未開始">未開始</option>
                <option value="規劃中">規劃中</option>
                <option value="進行中">進行中</option>
                <option value="已完成">已完成</option>
                <option value="自訂">自訂</option>
              </select>
            </td>
            <td>
              <button 
                onClick={() => movePhase(phase.id, "up")}
                className="yuniver-btn secondary btn-move"
              >↑</button>
              <button 
                onClick={() => movePhase(phase.id, "down")}
                className="yuniver-btn secondary btn-move"
              >↓</button>
            </td>
            <td style={{ textAlign: "center" }}>
              <input
                type="checkbox"
                checked={phase.showInFlowchart !== false}
                onChange={(e) => updateNode(phase.id, "showInFlowchart", e.target.checked)}
              />
            </td>
          </tr>
          
          {/* 若 Phase 沒有摺疊，則列出其子項目 */}
          {!collapsedPhases[phase.id] && (
            <>
              {/* 先渲染該 Phase 包含的子 Phase */}
              {[...nodes.filter(n => n.type === "phase" && String(n.containerId) === String(phase.id))]
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))  // 按照排序屬性排序
                .map(childPhase => renderPhaseWithChildren(childPhase, indentLevel + 1))
              }
              
              {/* 再渲染該 Phase 包含的 Task */}
              {[...nodes.filter(n => 
                  n.type === "task" && 
                  String(n.containerId) === String(phase.id) &&
                  (taskFilter === 'all' || n.status === '進行中')
                )]
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))  // 按照排序屬性排序
                .map(task => (
                  <tr key={task.id} className={`task-row status-${task.status === "未開始" ? "pending" : task.status === "規劃中" ? "planning" : task.status === "進行中" ? "in-progress" : task.status === "已完成" ? "completed" : "custom"}`}>
                    <td style={{ paddingLeft: `${paddingLeft + 20}px` }}>Task</td>
                    <td>
                      <input
                        type="text"
                        value={task.label}
                        onChange={(e) => updateNode(task.id, "label", e.target.value)}
                        className="form-control"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={task.description}
                        onChange={(e) => updateNode(task.id, "description", e.target.value)}
                        className="form-control"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={task.link || ""}
                        onChange={(e) => updateNode(task.id, "link", e.target.value)}
                        className="form-control"
                      />
                    </td>
                    <td>
                      <select
                        value={task.status}
                        onChange={(e) => updateNode(task.id, "status", e.target.value)}
                        className="form-control"
                      >
                        <option value="未開始">未開始</option>
                        <option value="規劃中">規劃中</option>
                        <option value="進行中">進行中</option>
                        <option value="已完成">已完成</option>
                        <option value="自訂">自訂</option>
                      </select>
                    </td>
                    <td>
                      <button 
                        onClick={() => moveTask(task.id, phase.id, "up")}
                        className="yuniver-btn secondary btn-move"
                      >↑</button>
                      <button 
                        onClick={() => moveTask(task.id, phase.id, "down")}
                        className="yuniver-btn secondary btn-move"
                      >↓</button>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={task.showInFlowchart !== false}
                        onChange={(e) => updateNode(task.id, "showInFlowchart", e.target.checked)}
                      />
                    </td>
                  </tr>
                ))
              }
              
              {/* 最後渲染其他類型的子元素 (subFlow, iterative, note, extra) */}
              {nodes
                .filter(n => 
                  n.type !== "phase" && n.type !== "task" && n.type !== "arrow" && 
                  String(n.containerId) === String(phase.id) &&
                  (taskFilter === 'all')
                )
                .map(otherNode => (
                  <tr key={otherNode.id} className="other-element-row">
                    <td style={{ paddingLeft: `${paddingLeft + 20}px` }}>{otherNode.type}</td>
                    <td>
                      <input
                        type="text"
                        value={otherNode.label || ""}
                        onChange={(e) => updateNode(otherNode.id, "label", e.target.value)}
                        className="form-control"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={otherNode.description || ""}
                        onChange={(e) => updateNode(otherNode.id, "description", e.target.value)}
                        className="form-control"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={otherNode.link || ""}
                        onChange={(e) => updateNode(otherNode.id, "link", e.target.value)}
                        className="form-control"
                      />
                    </td>
                    <td>
                      {otherNode.status !== undefined ? (
                        <input
                          type="text"
                          value={otherNode.status || ""}
                          onChange={(e) => updateNode(otherNode.id, "status", e.target.value)}
                          className="form-control"
                        />
                      ) : <span>-</span>}
                    </td>
                    <td>
                      {/* 其他元素暫無排序功能 */}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={otherNode.showInFlowchart !== false}
                        onChange={(e) => updateNode(otherNode.id, "showInFlowchart", e.target.checked)}
                      />
                    </td>
                  </tr>
                ))
              }
            </>
          )}
        </React.Fragment>
      );
    };

    return (
      <div>
        <table className="yuniver-table">
          <thead>
            <tr>
              <th>類型</th>
              <th>名稱</th>
              <th>描述</th>
              <th>連結</th>
              <th>狀態</th>
              <th>排序</th>
              <th>在流程圖顯示</th>
            </tr>
          </thead>
          <tbody>
            {/* 渲染頂層 Phase 及其所有子項目 */}
            {topLevelPhases.map(phase => renderPhaseWithChildren(phase))}
            
            {/* 顯示未歸屬於任何 Phase 的 Task */}
            {unassignedTasks.length > 0 && (
              <>
                {unassignedTasks.map(task => (
                  <tr key={task.id} className={`task-row status-${task.status === "未開始" ? "pending" : task.status === "規劃中" ? "planning" : task.status === "進行中" ? "in-progress" : task.status === "已完成" ? "completed" : "custom"}`}>
                    <td>Task (未分組)</td>
                    <td>
                      <input
                        type="text"
                        value={task.label}
                        onChange={(e) => updateNode(task.id, "label", e.target.value)}
                        className="form-control"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={task.description}
                        onChange={(e) => updateNode(task.id, "description", e.target.value)}
                        className="form-control"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={task.link || ""}
                        onChange={(e) => updateNode(task.id, "link", e.target.value)}
                        className="form-control"
                      />
                    </td>
                    <td>
                      <select
                        value={task.status}
                        onChange={(e) => updateNode(task.id, "status", e.target.value)}
                        className="form-control"
                      >
                        <option value="未開始">未開始</option>
                        <option value="規劃中">規劃中</option>
                        <option value="進行中">進行中</option>
                        <option value="已完成">已完成</option>
                        <option value="自訂">自訂</option>
                      </select>
                    </td>
                    <td>{/* 排序可依需求增加 */}</td>
                    <td style={{ textAlign: "center" }}>
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
            
            {/* 顯示其他未分類的元素 */}
            {unassignedOthers.length > 0 && taskFilter === 'all' && (
              <>
                {unassignedOthers.map(node => (
                  <tr key={node.id} className="other-element-row">
                    <td>{node.type} (未分組)</td>
                    <td>
                      <input
                        type="text"
                        value={node.label || ""}
                        onChange={(e) => updateNode(node.id, "label", e.target.value)}
                        className="form-control"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={node.description || ""}
                        onChange={(e) => updateNode(node.id, "description", e.target.value)}
                        className="form-control"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={node.link || ""}
                        onChange={(e) => updateNode(node.id, "link", e.target.value)}
                        className="form-control"
                      />
                    </td>
                    <td>
                      {node.status !== undefined ? (
                        <input
                          type="text"
                          value={node.status || ""}
                          onChange={(e) => updateNode(node.id, "status", e.target.value)}
                          className="form-control"
                        />
                      ) : <span>-</span>}
                    </td>
                    <td>
                      {/* 其他元素暫無排序功能 */}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={node.showInFlowchart !== false}
                        onChange={(e) => updateNode(node.id, "showInFlowchart", e.target.checked)}
                      />
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    );
  };
  
  const navigate = useNavigate();
  
  return (
    <>
      <div className="yuniver-flowchart-container">
        <div className="yuniver-flowchart-header">
          <h3 className="yuniver-flowchart-title">
            {project.projectName || "Unnamed Project"}
            <div className="project-hover-details">
              <p>
                <strong>客戶名稱:</strong> {project.clientName || "未設定"} <br />
                <strong>負責人:</strong> {project.owner?.username || "N/A"}<br />
                <strong>期間:</strong> {project.period?.startDate ? new Date(project.period.startDate).toLocaleDateString() : ""}
                  {" ~ "}
                  {project.period?.endDate ? new Date(project.period.endDate).toLocaleDateString() : ""}
              </p>
            </div>
          </h3>
          <div className="flowchart-header-buttons">
            <button 
              onClick={() => setShowFlowchartModal(true)}
              className="yuniver-btn secondary"
            >
              查看流程圖
            </button>
            <button 
              onClick={() => navigate(`/projects/${project._id}`)}
              className="yuniver-btn secondary"
            >
              查看專案
            </button>
          </div>
        </div>

        <div className="yuniver-flowchart-content">
          {renderListView()}
          
          {hasChanged && (
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <button 
                onClick={handleSaveFlowChart}
                className="yuniver-btn"
              >
                儲存流程圖
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* 流程圖彈窗 */}
      {showFlowchartModal && (
        <div className="flowchart-modal">
          <div className="flowchart-modal-content">
            <div className="flowchart-modal-header">
              <h3 className="flowchart-modal-title">流程圖 - {project.projectName}</h3>
              <button 
                className="flowchart-modal-close"
                onClick={() => setShowFlowchartModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="flowchart-modal-body">
              <iframe 
                src={`/flowchart-editor/${project._id}`}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  border: 'none',
                  display: 'block'
                }}
                title="專案流程圖"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectManagement;