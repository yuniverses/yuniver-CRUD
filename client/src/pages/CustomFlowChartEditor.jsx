// src/pages/CustomFlowChartEditor.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import "../css/main.css";
// 預設尺寸與手把大小
const NODE_WIDTH_DEFAULT = 140;
const NODE_HEIGHT_DEFAULT = 80;
const RESIZE_HANDLE_SIZE = 8;

// 定義允許的父節點與子節點類型
const allowedChildren = {
  phase: ["task"],
  task: ["subFlow", "iterative", "note", "extra"],
};

// 根據節點狀態設定背景顏色（預設）
const getStatusColor = (node) => {
  const statusColors = {
    "已完成": "#d4edda",
    "進行中": "#cce5ff",
    "規劃中": "#fff3cd",
    "未開始": "#e2e3e5",
    "自訂": "#f8d7da"
  };
  if (node.type === "phase" || node.type === "task") {
    return statusColors[node.status] || statusColors["未開始"];
  }
  return "#fff";
};
// 渲染箭頭函數
const renderArrow = (node) => {
  const { points } = node;
  if (!points || points.length < 2) return null;
  
  // 將所有點連接為SVG路徑
  let pathData = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathData += ` L ${points[i].x} ${points[i].y}`;
  }
  
  // 計算箭頭方向 (最後兩個點決定)
  const lastPoint = points[points.length - 1];
  const prevPoint = points[points.length - 2];
  const angle = Math.atan2(lastPoint.y - prevPoint.y, lastPoint.x - prevPoint.x);
  
  // 箭頭尖端
  const arrowLength = 10;
  const arrowAngle = Math.PI / 6; // 30度
  const x1 = lastPoint.x - arrowLength * Math.cos(angle - arrowAngle);
  const y1 = lastPoint.y - arrowLength * Math.sin(angle - arrowAngle);
  const x2 = lastPoint.x - arrowLength * Math.cos(angle + arrowAngle);
  const y2 = lastPoint.y - arrowLength * Math.sin(angle + arrowAngle);
  
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
      <path d={pathData} stroke="black" strokeWidth="2" fill="none" />
      <path d={`M ${lastPoint.x} ${lastPoint.y} L ${x1} ${y1} L ${x2} ${y2} Z`} fill="black" />
    </svg>
  );
};
// 根據形狀設定額外 CSS
const getShapeStyle = (shape) => {
  switch (shape) {
    case 'ellipse':
      return { borderRadius: "50px" };
    case 'parallelogram':
      return { transform: "skew(-20deg)" };
    case 'diamond':
      return { transform: "rotate(45deg)" };
    case 'rectangle':
    default:
      return {};
  }
};

// 根據 type 渲染節點內容與樣式
const renderNodeContent = (node) => {
  const commonStyle = { padding: "4px", textAlign: "center", overflow: "hidden", width: "100%", height: "100%" };
  const statusText = (node.type === "phase" || node.type === "task")
    ? `Status: ${node.status}${node.status === "自訂" && node.customStatus ? ` (${node.customStatus})` : ""}`
    : "";
  switch (node.type) {
    case "phase":
      return (
        <div style={{ ...commonStyle }}>
          <div style={{ fontWeight: "bold", fontSize: "14px" }}>{node.label}</div>
          <div style={{ fontSize: "12px" }}>{node.description}</div>
          <div style={{ fontSize: "10px", marginTop: "4px" }}>{statusText}</div>
        </div>
      );
    case "task":
      return (
        <div style={{ ...commonStyle }}>
          <div style={{ fontWeight: "bold", fontSize: "14px" }}>{node.label}</div>
          {node.important && <div style={{ color: "red", fontSize: "10px" }}>Important</div>}
          <div style={{ fontSize: "12px" }}>{node.description}</div>
          <div style={{ fontSize: "10px", marginTop: "4px" }}>{statusText}</div>
        </div>
      );
    case "subFlow":
      return (
        <div style={{ ...commonStyle, border: "2px solid gray", backgroundColor: "#f0f0f0" }}>
          <div style={{ fontWeight: "bold", fontSize: "13px" }}>{node.label}</div>
          <div style={{ fontSize: "11px" }}>{node.description}</div>
        </div>
      );
    case "iterative":
      return (
        <div style={{ ...commonStyle, border: "2px dotted green", backgroundColor: "#e8ffe8" }}>
          <div style={{ fontWeight: "bold", fontSize: "14px" }}>{node.label} 🔄</div>
          <div style={{ fontSize: "12px" }}>{node.description}</div>
        </div>
      );
    case "note":
      return (
        <div style={{ ...commonStyle, border: "1px solid orange", backgroundColor: "#fff7d6" }}>
          <div style={{ fontStyle: "italic", fontSize: "12px" }}>{node.text || node.label}</div>
          <div style={{ fontSize: "10px" }}>{node.description}</div>
        </div>
      );
    case "extra":
      return (
        <div style={{ ...commonStyle, fontSize:"10px", padding: "2px" }}>
          • {node.content}
        </div>
      );
    default:
      return (
        <div style={{ ...commonStyle, border: "1px solid black" }}>
          {node.label || "No Label"}
        </div>
      );
  }
};

// 輔助函式：判斷是否為拖曳節點的後代（根據 containerId 遞迴檢查）
const isDescendant = (draggedId, node, allNodes) => {
  if (node.containerId === draggedId) return true;
  if (!node.containerId) return false;
  const parent = allNodes.find(n => n.id === node.containerId);
  if (!parent) return false;
  return isDescendant(draggedId, parent, allNodes);
};

const CustomFlowChartEditor = () => {
  const { id } = useParams();
  const isTemplateMode = id.startsWith("template_");
  const realId = isTemplateMode ? id.split("_")[1] : id;
  const token = localStorage.getItem('token');
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
  const containerRef = useRef(null);

  // 取得角色 (假設 token payload 包含 role)
  const getRole = () => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role || null;
      } catch (error) {
        console.error("Token decoding error:", error);
      }
    }
    return null;
  };
  const role = getRole();
  // 若角色為 customer，則為唯讀模式
  const isReadOnly = role === "customer";

  // 節點資料
  const [nodes, setNodes] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [resizingNodeId, setResizingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  // 新增顯示模式：flowchart 或 list
  const [displayMode, setDisplayMode] = useState("flowchart");
  // 用來儲存每個 Phase 是否摺疊的狀態
  const [collapsedPhases, setCollapsedPhases] = useState({});

  // 讀取流程圖資料
  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = isTemplateMode
          ? `${API_URL}/templates/${realId}`
          : `${API_URL}/projects/${realId}/flowchart`;
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = isTemplateMode ? (res.data.flowChart || []) : (res.data || []);
        const mapped = data.map(item => ({
          ...item,
          position: item.position || { x: 50, y: 50 },
          size: item.size || { width: NODE_WIDTH_DEFAULT, height: NODE_HEIGHT_DEFAULT },
          containerId: item.containerId || null,
          children: item.children || [],
          status: (item.type === "phase" || item.type === "task") ? (item.status || "未開始") : item.status,
          shape: (item.type === "phase" || item.type === "task") ? (item.shape || "rectangle") : item.shape,
          // 新增顯示控制屬性，預設 true
          showInFlowchart: item.showInFlowchart !== false
        }));
        setNodes(mapped);
      } catch (error) {
        console.error("Failed to load flowchart:", error);
      }
    };
    fetchData();
  }, [realId, isTemplateMode, API_URL, token]);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  // 更新選中節點屬性
  const handleEditChange = (e) => {
    if (!selectedNodeId) return;
    const { name, value } = e.target;
    setNodes(prevNodes =>
      prevNodes.map(n =>
        n.id === selectedNodeId ? { ...n, [name]: value } : n
      )
    );
  };

// 新增箭頭控制點
const handleAddControlPoint = (nodeId) => {
  if (isReadOnly) return;
  
  setNodes(prevNodes => 
    prevNodes.map(n => {
      if (n.id === nodeId && n.type === "arrow") {
        // 計算新控制點的位置 (在最後一點和倒數第二點之間)
        const points = [...n.points];
        const lastIdx = points.length - 1;
        const newPoint = {
          x: (points[lastIdx].x + points[lastIdx-1].x) / 2,
          y: (points[lastIdx].y + points[lastIdx-1].y) / 2
        };
        
        // 在倒數第二點之後插入新點
        points.splice(lastIdx, 0, newPoint);
        
        return { ...n, points };
      }
      return n;
    })
  );
};

// 刪除箭頭控制點
const handleDeleteControlPoint = (nodeId, pointIndex) => {
  if (isReadOnly) return;
  
  setNodes(prevNodes => 
    prevNodes.map(n => {
      if (n.id === nodeId && n.type === "arrow") {
        // 保證至少保留兩個控制點
        if (n.points.length <= 2) return n;
        
        // 不允許刪除首尾控制點
        if (pointIndex === 0 || pointIndex === n.points.length - 1) return n;
        
        const newPoints = n.points.filter((_, idx) => idx !== pointIndex);
        return { ...n, points: newPoints };
      }
      return n;
    })
  );
};

  // 處理 children 欄位（逗號分隔轉陣列）
  const handleChildrenChange = (e) => {
    if (!selectedNodeId) return;
    const children = e.target.value.split(",").map(s => s.trim()).filter(s => s);
    setNodes(prevNodes =>
      prevNodes.map(n =>
        n.id === selectedNodeId ? { ...n, children } : n
      )
    );
  };

  // 切換核取方塊，設定節點是否在流程圖中顯示
  const handleToggleShow = (nodeId, value) => {
    setNodes(prevNodes =>
      prevNodes.map(n => n.id === nodeId ? { ...n, showInFlowchart: value } : n)
    );
  };

  // 切換 Phase 摺疊狀態
  const toggleCollapse = (phaseId) => {
    setCollapsedPhases(prev => ({
      ...prev,
      [phaseId]: !prev[phaseId]
    }));
  };

  // 若為唯讀模式，則不執行拖曳與縮放操作
  const handleMouseDown = (e, nodeId) => {
    if (isReadOnly) return;
    e.stopPropagation();
    const nodeElem = e.currentTarget;
    const rect = nodeElem.getBoundingClientRect();
    setDraggingNodeId(nodeId);
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = (e) => {
    if (isReadOnly) return;
    if (draggingNodeId) {
      setNodes(prevNodes => {
        const draggedNode = prevNodes.find(n => n.id === draggingNodeId);
        if (!draggedNode) return prevNodes;
        const containerRect = containerRef.current.getBoundingClientRect();
        const newX = e.clientX - containerRect.left - dragOffset.x;
        const newY = e.clientY - containerRect.top - dragOffset.y;
        const deltaX = newX - draggedNode.position.x;
        const deltaY = newY - draggedNode.position.y;
        return prevNodes.map(n => {
          if (n.id === draggingNodeId || isDescendant(draggingNodeId, n, prevNodes)) {
            return {
              ...n,
              position: {
                x: n.position.x + deltaX,
                y: n.position.y + deltaY
              }
            };
          }
          return n;
        });
      });
    }
    if (resizingNodeId) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const dx = e.clientX - containerRect.left - resizeStart.x;
      const dy = e.clientY - containerRect.top - resizeStart.y;
      setNodes(prevNodes =>
        prevNodes.map(n => {
          if (n.id === resizingNodeId) {
            return {
              ...n,
              size: {
                width: Math.max(40, resizeStart.width + dx),
                height: Math.max(30, resizeStart.height + dy)
              }
            };
          }
          return n;
        })
      );
    }
  };

  const handleMouseUp = () => {
    if (isReadOnly) return;
    if (draggingNodeId) {
      setNodes(prevNodes => {
        const draggedNode = prevNodes.find(n => n.id === draggingNodeId);
        let newContainerId = null;
        if (draggedNode) {
          const center = {
            x: draggedNode.position.x + draggedNode.size.width / 2,
            y: draggedNode.position.y + draggedNode.size.height / 2
          };
          prevNodes.forEach(parent => {
            if (parent.id !== draggedNode.id && (parent.type === "phase" || parent.type === "task")) {
              if (
                center.x >= parent.position.x &&
                center.x <= parent.position.x + parent.size.width &&
                center.y >= parent.position.y &&
                center.y <= parent.position.y + parent.size.height
              ) {
                const allowed = allowedChildren[parent.type] || [];
                if (allowed.includes(draggedNode.type)) {
                  newContainerId = parent.id;
                }
              }
            }
          });
        }
        return prevNodes.map(n => {
          if (n.id === draggingNodeId) {
            return { ...n, containerId: newContainerId };
          }
          if (n.type === "phase" || n.type === "task") {
            let newChildren = n.children ? [...n.children] : [];
            newChildren = newChildren.filter(childId => childId !== draggingNodeId);
            if (n.id === newContainerId) {
              newChildren.push(draggingNodeId);
            }
            return { ...n, children: newChildren };
          }
          return n;
        });
      });
      setDraggingNodeId(null);
    }
    if (resizingNodeId) {
      setResizingNodeId(null);
    }
  };

  // 節點選取（唯讀模式也可點選查看資訊）
  const handleSelectNode = (e, nodeId) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
  };

  // 開始縮放
  const handleResizeMouseDown = (e, nodeId) => {
    if (isReadOnly) return;
    e.stopPropagation();
    if (!selectedNode) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    setResizingNodeId(nodeId);
    setResizeStart({
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top,
      width: selectedNode.size.width,
      height: selectedNode.size.height
    });
  };

  // 刪除節點（唯讀模式不可操作）
  const handleDeleteNode = () => {
    if (isReadOnly || !selectedNodeId) return;
    setNodes(prevNodes =>
      prevNodes.filter(n => n.id !== selectedNodeId)
        .map(n => n.containerId === selectedNodeId ? { ...n, containerId: null } : n)
    );
    setSelectedNodeId(null);
  };

  // 新增節點（唯讀模式不可操作）
  const handleAddNewNode = (type = "task") => {
    if (isReadOnly) return;
    let newNode = null;
    // 新增節點函數中的箭頭部分
if (type === "arrow") {
  // 預設箭頭的寬高與控制點（points 為相對於箭頭區塊的座標）
  newNode = {
    id: `arrow_${Date.now()}`,
    type: "arrow",
    label: "Arrow",
    points: [
      { x: 10, y: NODE_HEIGHT_DEFAULT / 2 },
      { x: NODE_WIDTH_DEFAULT - 10, y: NODE_HEIGHT_DEFAULT / 2 }
    ],
    position: { x: 100, y: 100 },
    size: { width: NODE_WIDTH_DEFAULT, height: NODE_HEIGHT_DEFAULT },
    showInFlowchart: true
  };

    } else {
      newNode = {
        id: `${Date.now()}`,
        type,
        label: type === "phase" ? "New Phase" : "New Node",
        description: "",
        link: "",
        extras: [],
        children: [],
        containerId: null,
        position: { x: 50, y: 50 },
        size: { width: NODE_WIDTH_DEFAULT, height: NODE_HEIGHT_DEFAULT },
        status: (type === "phase" || type === "task") ? "未開始" : "",
        shape: (type === "phase" || type === "task") ? "rectangle" : "",
        showInFlowchart: true
      };
    }
    setNodes(prev => [...prev, newNode]);
  };

// 2. 新增狀態用於拖曳箭頭的控制點
const [draggingControlPoint, setDraggingControlPoint] = useState(null);

// 處理拖曳控制點
// 修改控制點鼠標事件處理
const handleControlPointMouseDown = (e, nodeId, pointIndex) => {
  e.stopPropagation();
  
  // 右鍵顯示菜單
  if (e.button === 2) {
    e.preventDefault();
    // 不允許刪除首尾控制點
    if (pointIndex !== 0 && pointIndex !== nodes.find(n => n.id === nodeId).points.length - 1) {
      handleDeleteControlPoint(nodeId, pointIndex);
    }
    return;
  }
  
  // 取得 container 的偏移量（方便計算相對座標）
  const containerRect = containerRef.current.getBoundingClientRect();
  setDraggingControlPoint({
    nodeId,
    pointIndex,
    offsetX: e.clientX - containerRect.left,
    offsetY: e.clientY - containerRect.top
  });
};

useEffect(() => {
  const handleControlPointMouseMove = (e) => {
    if (!draggingControlPoint) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newX = e.clientX - containerRect.left;
    const newY = e.clientY - containerRect.top;
    const dx = newX - draggingControlPoint.offsetX;
    const dy = newY - draggingControlPoint.offsetY;
    setNodes(prevNodes =>
      prevNodes.map(n => {
        if (n.id === draggingControlPoint.nodeId && n.type === "arrow") {
          // 更新指定控制點，注意這裡控制點為相對於箭頭區塊的座標，
          // 假設箭頭節點不會被縮放（或縮放時也更新 points）
          const newPoints = n.points.map((pt, idx) =>
            idx === draggingControlPoint.pointIndex
              ? { x: pt.x + dx, y: pt.y + dy }
              : pt
          );
          return { ...n, points: newPoints };
        }
        return n;
      })
    );
    // 更新拖曳起始點
    setDraggingControlPoint({
      ...draggingControlPoint,
      offsetX: newX,
      offsetY: newY
    });
  };

  const handleControlPointMouseUp = () => {
    setDraggingControlPoint(null);
  };

  window.addEventListener("mousemove", handleControlPointMouseMove);
  window.addEventListener("mouseup", handleControlPointMouseUp);
  return () => {
    window.removeEventListener("mousemove", handleControlPointMouseMove);
    window.removeEventListener("mouseup", handleControlPointMouseUp);
  };
}, [draggingControlPoint]);



  // 儲存流程圖（唯讀模式不可操作）
  const handleSave = async () => {
    if (isReadOnly) return;
    try {
      const url = isTemplateMode
        ? `${API_URL}/templates/${realId}`
        : `${API_URL}/projects/${realId}/flowchart`;
      await axios.put(url,
        { flowChart: nodes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Flowchart saved successfully!");
    } catch (error) {
      console.error("Failed to save flowchart:", error);
      alert("Save failed.");
    }
  };
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 如果焦點在 input 或 textarea 中，則不處理快捷鍵
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") {
        return;
      }
  
      // Delete 鍵刪除選中的節點
      if (e.key === "Delete") {
        e.preventDefault();
        handleDeleteNode();
      }
  // Delete 鍵刪除選中的節點
  if (e.key === "Backspace") {
    e.preventDefault();
    handleDeleteNode();
  }
      // Ctrl+S 或 Cmd+S 儲存流程圖
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };
  
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDeleteNode, handleSave]);
  
  // 下載流程圖 JSON
  const handleDownloadFlowchart = () => {
    const templateName = prompt("請輸入模板名稱：", `Flowchart Template ${realId}`);
    const exportData = {
      name: templateName,
      flowChart: nodes
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = `${templateName || "flowchart_template"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // 上傳流程圖 JSON
  const handleUploadFlowchart = (e) => {
    if (isReadOnly) return;
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (json.flowChart) {
          setNodes(json.flowChart);
        } else {
          setNodes(json);
        }
      } catch (error) {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  // Header 區塊，根據唯讀模式隱藏編輯相關按鈕
const renderHeader = () => (
  <div style={{ marginBottom: "10px" }}>
    
    {!isReadOnly && (
      <>
      <button onClick={() => setDisplayMode("flowchart")}>Flowchart View</button>
      <button onClick={() => setDisplayMode("list")} style={{ marginLeft: "10px" }}>List View</button>
        <button onClick={() => handleAddNewNode("task")} style={{ marginLeft: "10px" }}>Add Task</button>
        <button onClick={() => handleAddNewNode("phase")} style={{ marginLeft: "10px" }}>Add Phase</button>
        <button onClick={() => handleAddNewNode("arrow")} style={{ marginLeft: "10px" }}>Add Arrow</button>
        <button onClick={handleSave} style={{ marginLeft: "10px" }}>Save Flow Chart</button>
        <button onClick={handleDownloadFlowchart} style={{ marginLeft: "10px" }}>Download Flowchart</button>
        <label style={{ marginLeft: "10px" }}>
          Import Flowchart:
          <input type="file" accept=".json" onChange={handleUploadFlowchart} style={{ marginLeft: "5px" }} />
        </label>
      </>
    )}
  </div>
);
// 移動 Phase：在 nodes 陣列中僅針對 type === "phase" 部分調整順序
const movePhase = (phaseId, direction) => {
  if (isReadOnly) return;
  setNodes(prevNodes => {
    // 把 Phase 與其他節點分離
    const phases = prevNodes.filter(n => n.type === "phase");
    const others = prevNodes.filter(n => n.type !== "phase");
    const index = phases.findIndex(p => p.id === phaseId);
    if (index === -1) return prevNodes;
    const newIndex = index + (direction === "up" ? -1 : 1);
    if (newIndex < 0 || newIndex >= phases.length) return prevNodes;
    // 交換順序
    [phases[index], phases[newIndex]] = [phases[newIndex], phases[index]];
    // 回傳新的 nodes 陣列：這裡假設 Phase 順序不影響其他節點位置
    return [...phases, ...others];
  });
};

// 移動 Task：僅針對屬於同一 Phase (containerId) 的 Task 進行交換
const moveTask = (taskId, phaseId, direction) => {
  if (isReadOnly) return;
  setNodes(prevNodes => {
    // 分離出屬於該 Phase 的 Task 與其他節點
    const tasks = prevNodes.filter(n => n.type === "task" && String(n.containerId) === String(phaseId));
    const others = prevNodes.filter(n => !(n.type === "task" && String(n.containerId) === String(phaseId)));
    const index = tasks.findIndex(t => t.id === taskId);
    if (index === -1) return prevNodes;
    const newIndex = index + (direction === "up" ? -1 : 1);
    if (newIndex < 0 || newIndex >= tasks.length) return prevNodes;
    [tasks[index], tasks[newIndex]] = [tasks[newIndex], tasks[index]];
    // 回傳新的 nodes 陣列：簡單合併（此方式僅適用於該 Phase 下 Task 都是連續的情況）
    return [...others, ...tasks];
  });
};

  // 列表模式：以表格呈現 Phase 與 Task（唯讀模式下僅可查看與設定 Show in Flowchart）
  const renderListView = () => {
    // 取出所有 Phase 節點
    const phases = nodes.filter(n => n.type === "phase");
    // 取出未指定 container 的 Task（單獨任務）
    const unassignedTasks = nodes.filter(n => n.type === "task" && !n.containerId);
  
    // 更新節點函式（已在上面定義的 updateNode 函式）
    const updateNode = (nodeId, field, value) => {
      if (isReadOnly) return;
      setNodes(prevNodes =>
        prevNodes.map(n => n.id === nodeId ? { ...n, [field]: value } : n)
      );
    };
  
    return (
      <div style={{ padding: "20px" }}>
        <h2>Flowchart List View</h2>
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
                <tr style={{ backgroundColor: "#f0f0f0" }}>
                  <td>
                    {/* 點擊箭頭展開/摺疊 */}
                    <span onClick={() => toggleCollapse(phase.id)} style={{ cursor: "pointer", marginRight: "5px" }}>
                      {collapsedPhases[phase.id] ? "▽" : "△"}
                    </span>
                    Phase
                  </td>
                  <td>
                    <input
                      type="text"
                      value={phase.label}
                      onChange={(e) => updateNode(phase.id, "label", e.target.value)}
                      disabled={isReadOnly}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={phase.description}
                      onChange={(e) => updateNode(phase.id, "description", e.target.value)}
                      disabled={isReadOnly}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={phase.link || ""}
                      onChange={(e) => updateNode(phase.id, "link", e.target.value)}
                      disabled={isReadOnly}
                    />
                  </td>
                  <td>
                    <select
                      value={phase.status}
                      onChange={(e) => updateNode(phase.id, "status", e.target.value)}
                      disabled={isReadOnly}
                    >
                      <option value="未開始">未開始</option>
                      <option value="規劃中">規劃中</option>
                      <option value="進行中">進行中</option>
                      <option value="已完成">已完成</option>
                      <option value="自訂">自訂</option>
                    </select>
                  </td>
                  <td>
                    {!isReadOnly && (
                      <>
                        <button onClick={() => movePhase(phase.id, "up")}>↑</button>
                        <button onClick={() => movePhase(phase.id, "down")}>↓</button>
                      </>
                    )}
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={phase.showInFlowchart !== false}
                      onChange={(e) => updateNode(phase.id, "showInFlowchart", e.target.checked)}
                      disabled={isReadOnly}
                    />
                  </td>
                </tr>
                {/* 若 Phase 沒有摺疊，則列出其下 Task */}
                {!collapsedPhases[phase.id] &&
                  nodes.filter(n => n.type === "task" && String(n.containerId) === String(phase.id))
                    .map(task => (
                      <tr key={task.id}>
                        <td style={{ paddingLeft: "20px" }}>Task</td>
                        <td>
                          <input
                            type="text"
                            value={task.label}
                            onChange={(e) => updateNode(task.id, "label", e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={task.description}
                            onChange={(e) => updateNode(task.id, "description", e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={task.link || ""}
                            onChange={(e) => updateNode(task.id, "link", e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td>
                          <select
                            value={task.status}
                            onChange={(e) => updateNode(task.id, "status", e.target.value)}
                            disabled={isReadOnly}
                          >
                            <option value="未開始">未開始</option>
                            <option value="規劃中">規劃中</option>
                            <option value="進行中">進行中</option>
                            <option value="已完成">已完成</option>
                            <option value="自訂">自訂</option>
                          </select>
                        </td>
                        <td>
                          {!isReadOnly && (
                            <>
                              <button onClick={() => moveTask(task.id, phase.id, "up")}>↑</button>
                              <button onClick={() => moveTask(task.id, phase.id, "down")}>↓</button>
                            </>
                          )}
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={task.showInFlowchart !== false}
                            onChange={(e) => updateNode(task.id, "showInFlowchart", e.target.checked)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                    ))
                }
              </React.Fragment>
            ))}
            {/* 顯示未歸屬於 Phase 的 Task */}
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
                        disabled={isReadOnly}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={task.description}
                        onChange={(e) => updateNode(task.id, "description", e.target.value)}
                        disabled={isReadOnly}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={task.link || ""}
                        onChange={(e) => updateNode(task.id, "link", e.target.value)}
                        disabled={isReadOnly}
                      />
                    </td>
                    <td>
                      <select
                        value={task.status}
                        onChange={(e) => updateNode(task.id, "status", e.target.value)}
                        disabled={isReadOnly}
                      >
                        <option value="未開始">未開始</option>
                        <option value="規劃中">規劃中</option>
                        <option value="進行中">進行中</option>
                        <option value="已完成">已完成</option>
                        <option value="自訂">自訂</option>
                      </select>
                    </td>
                    <td>
                      {!isReadOnly && (
                        <>
                          {/* 由於此 task 沒有 Phase 父層，排序就直接在 unassigned 群組中處理 */}
                          {/* 可依照需要新增 moveUnassignedTask 函式 */}
                        </>
                      )}
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={task.showInFlowchart !== false}
                        onChange={(e) => updateNode(task.id, "showInFlowchart", e.target.checked)}
                        disabled={isReadOnly}
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

  // 流程圖模式：只顯示 showInFlowchart 為 true 的節點
  const renderFlowchartView = () => (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "600px",
        border: "1px solid #ccc",
        backgroundColor: "#fafafa"
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
{nodes
  .filter(node => node.showInFlowchart !== false)
  .map(node => {
    if (node.type === "arrow") {
      return (
        <div
          key={node.id}
          style={{
            position: "absolute",
            left: node.position.x,
            top: node.position.y,
            width: node.size.width,
            height: node.size.height,
            border: selectedNodeId === node.id ? "2px dashed red" : "0px dashed #999",
            backgroundColor: "transparent",
            cursor: isReadOnly ? "default" : "move",
            zIndex: 1
          }}
          onMouseDown={(e) => handleMouseDown(e, node.id)}
          onClick={(e) => handleSelectNode(e, node.id)}
        >
          {renderArrow(node)}
          
          {/* 控制點 - 僅在選中狀態且非唯讀模式時顯示 */}
          {!isReadOnly && selectedNodeId === node.id && node.points.map((point, index) => (
            <div
              key={`point-${index}`}
              style={{
                position: "absolute",
                left: point.x - 4,
                top: point.y - 4,
                width: 8,
                height: 8,
                backgroundColor: "blue",
                border: "1px solid white",
                borderRadius: "50%",
                cursor: "pointer",
                zIndex: 20
              }}
              onMouseDown={(e) => handleControlPointMouseDown(e, node.id, index)}
            />
          ))}
          
          {/* 新增控制點按鈕 - 僅在選中狀態且非唯讀模式時顯示 */}
          {!isReadOnly && selectedNodeId === node.id && (
            <button
              style={{
                position: "absolute",
                right: 0,
                top: -25,
                fontSize: "10px",
                padding: "2px 5px"
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleAddControlPoint(node.id);
              }}
            >
              + Point
            </button>
          )}
          
          {/* 縮放控制點 */}
          {!isReadOnly && selectedNodeId === node.id && (
            <div
              style={{
                position: "absolute",
                right: 0,
                bottom: 0,
                width: RESIZE_HANDLE_SIZE,
                height: RESIZE_HANDLE_SIZE,
                backgroundColor: "gray",
                cursor: "se-resize"
              }}
              onMouseDown={(e) => handleResizeMouseDown(e, node.id)}
            />
          )}
        </div>
      );
    }
    
    // 現有的非箭頭節點渲染代碼...
    const zIndex = node.containerId
      ? 10
      : (node.type === "phase" || node.type === "task" ? 5 : 1);
    return (
      <div
        key={node.id}
        style={{
          position: "absolute",
          left: node.position.x,
          top: node.position.y,
          width: node.size.width,
          height: node.size.height,
          border: selectedNodeId === node.id ? "2px solid red" : "1px solid #333",
          boxSizing: "border-box",
          backgroundColor:
            (node.type === "phase" || node.type === "task")
              ? getStatusColor(node)
              : "#fff",
          cursor: isReadOnly ? "default" : "move",
          zIndex,
          ...getShapeStyle(node.shape)
        }}
        onMouseDown={(e) => handleMouseDown(e, node.id)}
        onClick={(e) => handleSelectNode(e, node.id)}
      >
        {renderNodeContent(node)}
        {!isReadOnly && selectedNodeId === node.id && (
          <div
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              width: RESIZE_HANDLE_SIZE,
              height: RESIZE_HANDLE_SIZE,
              backgroundColor: "gray",
              cursor: "se-resize"
            }}
            onMouseDown={(e) => handleResizeMouseDown(e, node.id)}
          />
        )}
      </div>
    );
  })}
    </div>
  );

  return (
    <div>
      <h2>Custom Flow Chart Editor {isTemplateMode ? "(Template Mode)" : ""}</h2>
      {renderHeader()}
      {displayMode === "flowchart" ? renderFlowchartView() : renderListView()}
      {!isReadOnly && selectedNode && (
        <div style={{ marginTop: "20px", border: "1px solid #ccc", padding: "10px" }}>
          <h3>Edit Node Properties</h3>
          <div>
            <label>Type:</label>
            <select name="type" value={selectedNode.type} onChange={handleEditChange}>
              <option value="phase">phase</option>
              <option value="task">task</option>
              <option value="subFlow">subFlow</option>
              <option value="iterative">iterative</option>
              <option value="note">note</option>
              <option value="extra">extra</option>
            </select>
          </div>
          <div>
            <label>Label:</label>
            <input name="label" value={selectedNode.label} onChange={handleEditChange} />
          </div>
          <div>
            <label>Description:</label>
            <textarea name="description" value={selectedNode.description} onChange={handleEditChange} />
          </div>
          <div>
            <label>Link:</label>
            <input name="link" value={selectedNode.link} onChange={handleEditChange} />
          </div>
          {(selectedNode.type === "phase" || selectedNode.type === "task") && (
            <div>
              <label>Status:</label>
              <select name="status" value={selectedNode.status} onChange={handleEditChange}>
                <option value="未開始">未開始</option>
                <option value="規劃中">規劃中</option>
                <option value="進行中">進行中</option>
                <option value="已完成">已完成</option>
                <option value="自訂">自訂</option>
              </select>
              {selectedNode.status === "自訂" && (
                <div>
                  <label>Custom Status:</label>
                  <input name="customStatus" value={selectedNode.customStatus || ""} onChange={handleEditChange} />
                </div>
              )}
              <div>
                <label>Shape:</label>
                <select name="shape" value={selectedNode.shape} onChange={handleEditChange}>
                  <option value="rectangle">矩形</option>
                  <option value="ellipse">橢圓 / 藥丸</option>
                  <option value="parallelogram">平行四邊形</option>
                  <option value="diamond">菱形</option>
                </select>
              </div>
            </div>
          )}
          <div>
            <label>Children (comma-separated IDs):</label>
            <input
              value={(selectedNode.children || []).join(",")}
              onChange={handleChildrenChange}
            />
          </div>
          <div>
            <label>Extras (comma-separated):</label>
            <input
              name="extras"
              value={(selectedNode.extras || []).join(",")}
              onChange={(e) => {
                const arr = e.target.value.split(",").map(s => s.trim()).filter(s => s);
                handleEditChange({ target: { name: "extras", value: arr } });
              }}
            />
          </div>
          <div style={{ marginTop: "10px" }}>
            <button onClick={handleDeleteNode}>Delete Node</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomFlowChartEditor;
