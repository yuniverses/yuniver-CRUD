// src/pages/CustomFlowChartEditor.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import "../css/main.css";
import "../css/custom-communication.css";
// 預設尺寸與手把大小
const NODE_WIDTH_DEFAULT = 140;
const NODE_HEIGHT_DEFAULT = 80;
const RESIZE_HANDLE_SIZE = 8;

// 定義允許的父節點與子節點類型
const allowedChildren = {
  phase: ["task", "phase", "subFlow", "iterative", "note", "extra"],
  task: ["subFlow", "iterative", "note", "extra"],
};

// 根據節點狀態設定背景顏色（預設）
const getStatusColor = (node) => {
  const statusColors = {
    "已完成": "rgba(116, 207, 98, 0.42)",
    "進行中": "rgba(255, 102, 0, 0.35)",
    "規劃中": "rgba(251, 177, 127, 0.22)",
    "未開始": "rgba(0, 0, 0, 0.08)",
    "自訂": "#FFFFFF"
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
  const popupRef = useRef(null);

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
  // 用於彈出式編輯視窗
  const [editingPopupNode, setEditingPopupNode] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedNodes, setLastSavedNodes] = useState([]);

  // 讀取流程圖資料
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsSaving(true);
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
          showInFlowchart: item.showInFlowchart !== false,
          showForCustomer: item.showForCustomer !== false
        }));
        setNodes(mapped);
        setLastSavedNodes(mapped);
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error("Failed to load flowchart:", error);
      } finally {
        setIsSaving(false);
      }
    };
    fetchData();
  }, [realId, isTemplateMode, API_URL, token]);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  // 更新選中節點屬性
  const handleEditChange = (e) => {
    if (!selectedNodeId) return;
    const { name, value } = e.target;
    
    // 更新顯示設定時，同時更新所有子元素
    if (name === "showInFlowchart" || name === "showForCustomer") {
      setNodes(prevNodes => {
        // 找出要更新的節點
        const targetNode = prevNodes.find(n => n.id === selectedNodeId);
        if (!targetNode) return prevNodes;
        
        // 如果是phase，recursively 找出所有子元素
        const findAllChildren = (parentId) => {
          const directChildren = prevNodes.filter(n => n.containerId === parentId);
          let allChildren = [...directChildren];
          
          directChildren.forEach(child => {
            if (child.type === "phase" || child.type === "task") {
              allChildren = [...allChildren, ...findAllChildren(child.id)];
            }
          });
          
          return allChildren;
        };
        
        const childrenIds = targetNode.type === "phase" ? 
          findAllChildren(selectedNodeId).map(child => child.id) : [];
        
        // 更新目標節點和所有子節點
        const newNodes = prevNodes.map(n => {
          if (n.id === selectedNodeId || childrenIds.includes(n.id)) {
            return { ...n, [name]: value };
          }
          return n;
        });
        
        setHasUnsavedChanges(true);
        return newNodes;
      });
    } else {
      // 其他欄位只更新單一節點
      setNodes(prevNodes => {
        const newNodes = prevNodes.map(n =>
          n.id === selectedNodeId ? { ...n, [name]: value } : n
        );
        setHasUnsavedChanges(true);
        return newNodes;
      });
    }
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
        let newContainerId = draggedNode ? draggedNode.containerId : null; // 保持原有的父节点
        
        // 避免循環參照：檢查是否將節點拖入其子節點內
        const isCircularReference = (parentId, childId) => {
          // 如果父節點ID等於子節點ID，這是循環參照
          if (parentId === childId) return true;
          
          // 取得子節點的所有子節點ID
          const child = prevNodes.find(n => n.id === childId);
          if (!child || !child.children || child.children.length === 0) return false;
          
          // 對每個子節點的子節點遞迴檢查
          return child.children.some(grandChildId => 
            isCircularReference(parentId, grandChildId)
          );
        };
        
        if (draggedNode) {
          const center = {
            x: draggedNode.position.x + draggedNode.size.width / 2,
            y: draggedNode.position.y + draggedNode.size.height / 2
          };
          
          // 找出所有可能的容器節點，並按照 z-index 排序（較高的 z-index 優先）
          const potentialContainers = prevNodes
            .filter(parent => 
              parent.id !== draggedNode.id && 
              (parent.type === "phase" || parent.type === "task") &&
              center.x >= parent.position.x &&
              center.x <= parent.position.x + parent.size.width &&
              center.y >= parent.position.y &&
              center.y <= parent.position.y + parent.size.height
            )
            .sort((a, b) => {
              // 計算 z-index: 根據 containerId 的存在來判斷層級
              const getDepth = (node) => {
                if (!node.containerId) return 0;
                const parent = prevNodes.find(n => n.id === node.containerId);
                return parent ? 1 + getDepth(parent) : 1;
              };
              
              return getDepth(b) - getDepth(a); // 較深層級的容器優先選擇
            });
          
          // 選擇第一個合適的容器作為新的父節點
          for (const parent of potentialContainers) {
            const allowed = allowedChildren[parent.type] || [];
            // 檢查是否允許此類型的子節點，且不會造成循環參照
            if (allowed.includes(draggedNode.type) && !isCircularReference(draggedNode.id, parent.id)) {
              newContainerId = parent.id;
              break;
            }
          }
        }
        
        const updatedNodes = prevNodes.map(n => {
          if (n.id === draggingNodeId) {
            return { ...n, containerId: newContainerId };
          }
          // 更新所有可能的父節點的children屬性
          if (n.type === "phase" || n.type === "task") {
            let newChildren = n.children ? [...n.children] : [];
            // 先從所有節點的children中移除拖曳的節點
            newChildren = newChildren.filter(childId => childId !== draggingNodeId);
            // 如果此節點是新的父節點，則添加拖曳的節點到其children
            if (n.id === newContainerId) {
              newChildren.push(draggingNodeId);
            }
            return { ...n, children: newChildren };
          }
          return n;
        });
        
        setHasUnsavedChanges(true);
        // 觸發下一個渲染週期後執行自動儲存
        setTimeout(() => autoSave(), 0);
        
        return updatedNodes;
      });
      setDraggingNodeId(null);
    }
    if (resizingNodeId) {
      setResizingNodeId(null);
      // 縮放完成後自動儲存
      setHasUnsavedChanges(true);
      setTimeout(() => autoSave(), 0);
    }
  };

  // 節點選取（唯讀模式也可點選查看資訊）
  const handleSelectNode = (e, nodeId) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
  };
  
  // 雙擊節點打開編輯彈窗
  const handleDoubleClick = (e, nodeId) => {
    if (isReadOnly) return;
    e.stopPropagation();
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // 計算彈窗位置 - 位於節點右側
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // 先進行一次自動儲存 (如果有未儲存的變更)
    if (hasUnsavedChanges && !isSaving) {
      autoSave();
    }
    
    setEditingPopupNode(node);
    setPopupPosition({
      x: rect.right - containerRect.left + 10, // 節點右側偏移10px
      y: rect.top - containerRect.top
    });
  };
  
  // 關閉彈窗
  const closePopup = () => {
    if (hasUnsavedChanges && !isSaving) {
      if (window.confirm('您尚未儲存變更，確定要關閉編輯視窗嗎？')) {
        setEditingPopupNode(null);
      }
    } else {
      setEditingPopupNode(null);
    }
  };
  
  // 點擊容器時關閉彈窗
  const handleContainerClick = (e) => {
    // 檢查點擊是否發生在彈窗內部
    if (popupRef.current && !popupRef.current.contains(e.target)) {
      closePopup();
    }
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


  // 刪除節點（唯讀模式不可操作）
  const handleDeleteNode = () => {
    if (isReadOnly || !selectedNodeId) return;
    setNodes(prevNodes => {
      const updatedNodes = prevNodes.filter(n => n.id !== selectedNodeId)
        .map(n => n.containerId === selectedNodeId ? { ...n, containerId: null } : n);
      
      setHasUnsavedChanges(true);
      setTimeout(() => autoSave(), 0);
      return updatedNodes;
    });
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
        label: type === "phase" ? "新階段" : "新節點",
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
    setNodes(prev => {
      setHasUnsavedChanges(true);
      setTimeout(() => autoSave(), 0);
      return [...prev, newNode];
    });
  };

  // 自動儲存流程圖
  const autoSave = async () => {
    if (isReadOnly || !hasUnsavedChanges || isSaving) return;
    
    try {
      setIsSaving(true);
      const url = isTemplateMode
        ? `${API_URL}/templates/${realId}`
        : `${API_URL}/projects/${realId}/flowchart`;
      
      await axios.put(url,
        { flowChart: nodes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setHasUnsavedChanges(false);
      setLastSavedNodes(nodes);
      console.log("自動儲存成功");
    } catch (error) {
      console.error("自動儲存失敗:", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // 手動儲存流程圖（唯讀模式不可操作）
  const handleSave = async () => {
    if (isReadOnly || !hasUnsavedChanges || isSaving) return;
    
    try {
      setIsSaving(true);
      const url = isTemplateMode
        ? `${API_URL}/templates/${realId}`
        : `${API_URL}/projects/${realId}/flowchart`;
      
      await axios.put(url,
        { flowChart: nodes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setHasUnsavedChanges(false);
      setLastSavedNodes(nodes);
    } catch (error) {
      console.error("儲存失敗:", error);
      alert("儲存失敗，請重試。");
    } finally {
      setIsSaving(false);
    }
  };
  // 定時自動儲存
  useEffect(() => {
    const saveInterval = setInterval(() => {
      autoSave();
    }, 30000); // 每30秒自動儲存一次
    
    return () => clearInterval(saveInterval);
  }, [nodes, hasUnsavedChanges, isSaving]);
  
  // 監控節點變動
  useEffect(() => {
    if (JSON.stringify(nodes) !== JSON.stringify(lastSavedNodes)) {
      setHasUnsavedChanges(true);
    }
  }, [nodes]);
  
  // 離開前警告
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        const message = '您尚未儲存變更，確定要離開嗎？';
        e.returnValue = message;
        return message;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      // 在組件卸載前自動儲存
      if (hasUnsavedChanges && !isSaving) {
        autoSave();
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, isSaving]);
  
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
  <div className="flowchart-controls">
    {!isReadOnly && (
      <>
        <div className="yuniver-segment">
          <button 
            onClick={() => setDisplayMode("flowchart")} 
            className={`yuniver-segment-btn ${displayMode === "flowchart" ? "active" : ""}`}
          >
            流程圖視圖
          </button>
          <button 
            onClick={() => setDisplayMode("list")} 
            className={`yuniver-segment-btn ${displayMode === "list" ? "active" : ""}`}
          >
            列表視圖
          </button>
        </div>
        <button onClick={() => handleAddNewNode("task")} className="yuniver-btn secondary yuniver-filter-btn">
          新增任務
        </button>
        <button onClick={() => handleAddNewNode("phase")} className="yuniver-btn secondary yuniver-filter-btn">
          新增階段
        </button>
        <button onClick={() => handleAddNewNode("arrow")} className="yuniver-btn secondary yuniver-filter-btn">
          新增箭頭
        </button>
        <button 
          onClick={handleSave} 
          className={`yuniver-btn yuniver-filter-btn ${!hasUnsavedChanges ? 'disabled' : ''}`}
          disabled={isSaving || !hasUnsavedChanges}
        >
          {isSaving ? '儲存中...' : (hasUnsavedChanges ? '儲存流程圖' : '已儲存')}
        </button>
        <button onClick={handleDownloadFlowchart} className="yuniver-btn secondary yuniver-filter-btn">
          下載流程圖
        </button>
        <div className="flowchart-import">
          <label className="yuniver-btn secondary">
            匯入流程圖
            <input type="file" accept=".json" onChange={handleUploadFlowchart} style={{ display: "none" }} />
          </label>
        </div>
      </>
    )}
  </div>
);
// 移動 Phase：能處理巢狀 Phase 的排序
const movePhase = (phaseId, direction) => {
  if (isReadOnly) return;
  
  setNodes(prevNodes => {
    // 找到目標 Phase
    const targetPhase = prevNodes.find(n => n.id === phaseId);
    if (!targetPhase) return prevNodes;
    
    // 獲取同一層級的 Phase 節點（相同的父節點）
    let siblingPhases = prevNodes.filter(n => 
      n.type === "phase" && 
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
    const newIndex = index + (direction === "up" ? -1 : 1);
    
    // 確保新索引在有效範圍內
    if (newIndex < 0 || newIndex >= siblingPhases.length) return prevNodes;
    
    // 獲取要交換的兩個元素
    const currentElement = siblingPhases[index];
    const swapElement = siblingPhases[newIndex];
    
    // 交換排序值
    const currentSortOrder = currentElement.sortOrder || index * 10;
    const swapSortOrder = swapElement.sortOrder || newIndex * 10;
    
    // 使用交換後的排序值創建更新的節點陣列
    const updatedNodes = prevNodes.map(node => {
      if (node.id === currentElement.id) {
        return { ...node, sortOrder: swapSortOrder };
      } else if (node.id === swapElement.id) {
        return { ...node, sortOrder: currentSortOrder };
      }
      return node;
    });
    
    // 設置未儲存狀態並自動儲存
    setHasUnsavedChanges(true);
    setTimeout(() => autoSave(), 0);
    
    return updatedNodes;
  });
};

// 移動 Task：僅針對屬於同一 Phase (containerId) 的 Task 進行交換
const moveTask = (taskId, phaseId, direction) => {
  if (isReadOnly) return;
  
  setNodes(prevNodes => {
    // 找到目標 Task
    const targetTask = prevNodes.find(n => n.id === taskId);
    if (!targetTask) return prevNodes;
    
    // 獲取同一 Phase 下的所有 Task 節點
    let siblingTasks = prevNodes.filter(n => 
      n.type === "task" && 
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
    const newIndex = index + (direction === "up" ? -1 : 1);
    
    // 確保新索引在有效範圍內
    if (newIndex < 0 || newIndex >= siblingTasks.length) return prevNodes;
    
    // 獲取要交換的兩個元素
    const currentElement = siblingTasks[index];
    const swapElement = siblingTasks[newIndex];
    
    // 交換排序值
    const currentSortOrder = currentElement.sortOrder || index * 10;
    const swapSortOrder = swapElement.sortOrder || newIndex * 10;
    
    // 使用交換後的排序值創建更新的節點陣列
    const updatedNodes = prevNodes.map(node => {
      if (node.id === currentElement.id) {
        return { ...node, sortOrder: swapSortOrder };
      } else if (node.id === swapElement.id) {
        return { ...node, sortOrder: currentSortOrder };
      }
      return node;
    });
    
    // 設置未儲存狀態並自動儲存
    setHasUnsavedChanges(true);
    setTimeout(() => autoSave(), 0);
    
    return updatedNodes;
  });
};

  // 列表模式：以表格呈現 Phase 與 Task（唯讀模式下僅可查看與設定 Show in Flowchart）
  const renderListView = () => {
    // 取出未指定 container 的 Phase 節點（頂層 Phase），並按照sortOrder排序
    const topLevelPhases = [...nodes.filter(n => n.type === "phase" && !n.containerId)]
      .sort((a, b) => {
        // 優先使用排序屬性，如果不存在則使用id
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      });
    // 取出未指定 container 的 Task（單獨任務）
    const unassignedTasks = nodes.filter(n => n.type === "task" && !n.containerId);
    // 其他未分類的元素（非Phase, 非Task, 且無容器）
    const unassignedOthers = nodes.filter(n => 
      n.type !== "phase" && n.type !== "task" && 
      n.type !== "arrow" && !n.containerId
    );
  
    // 更新節點函式
    const updateNode = (nodeId, field, value) => {
      if (isReadOnly) return;
      
      // 更新顯示設定時，同時更新所有子元素
      if (field === "showInFlowchart" || field === "showForCustomer") {
        setNodes(prevNodes => {
          // 找出要更新的節點
          const targetNode = prevNodes.find(n => n.id === nodeId);
          if (!targetNode) return prevNodes;
          
          // 如果是phase，recursively 找出所有子元素
          const findAllChildren = (parentId) => {
            const directChildren = prevNodes.filter(n => n.containerId === parentId);
            let allChildren = [...directChildren];
            
            directChildren.forEach(child => {
              if (child.type === "phase" || child.type === "task") {
                allChildren = [...allChildren, ...findAllChildren(child.id)];
              }
            });
            
            return allChildren;
          };
          
          const childrenIds = targetNode.type === "phase" ? 
            findAllChildren(nodeId).map(child => child.id) : [];
          
          // 更新目標節點和所有子節點
          return prevNodes.map(n => {
            if (n.id === nodeId || childrenIds.includes(n.id)) {
              return { ...n, [field]: value };
            }
            return n;
          });
        });
      } else {
        // 其他欄位只更新單一節點
        setNodes(prevNodes =>
          prevNodes.map(n => n.id === nodeId ? { ...n, [field]: value } : n)
        );
      }
    };

    // 遞迴渲染 Phase 及其子項目（可包含 Task 和 Phase）
    const renderPhaseWithChildren = (phase, indentLevel = 0) => {
      const paddingLeft = indentLevel * 20;
      const bgColor = indentLevel % 2 === 0 ? "#f0f0f0" : "#e8e8e8";
      
      return (
        <React.Fragment key={phase.id}>
          <tr style={{ backgroundColor: bgColor }}>
            <td style={{ paddingLeft: `${paddingLeft}px` }}>
              {/* 點擊箭頭展開/摺疊 */}
              <span onClick={() => toggleCollapse(phase.id)} style={{ cursor: "pointer", marginRight: "5px" }}>
                {collapsedPhases[phase.id] ? "▽" : "△"}
              </span>
              Phase {indentLevel > 0 ? `(巢狀層級: ${indentLevel})` : ""}
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
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ display: "flex", alignItems: "center", fontSize: "12px" }}>
                  <input
                    type="checkbox"
                    checked={phase.showInFlowchart !== false}
                    onChange={(e) => updateNode(phase.id, "showInFlowchart", e.target.checked)}
                    disabled={isReadOnly}
                    style={{ marginRight: "5px" }}
                  />
                  流程圖
                </label>
                <label style={{ display: "flex", alignItems: "center", fontSize: "12px" }}>
                  <input
                    type="checkbox"
                    checked={phase.showForCustomer !== false}
                    onChange={(e) => updateNode(phase.id, "showForCustomer", e.target.checked)}
                    disabled={isReadOnly}
                    style={{ marginRight: "5px" }}
                  />
                  顧客可見
                </label>
              </div>
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
              {[...nodes.filter(n => n.type === "task" && String(n.containerId) === String(phase.id))]
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))  // 按照排序屬性排序
                .map(task => (
                  <tr key={task.id}>
                    <td style={{ paddingLeft: `${paddingLeft + 20}px` }}>Task</td>
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
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        <label style={{ display: "flex", alignItems: "center", fontSize: "12px" }}>
                          <input
                            type="checkbox"
                            checked={task.showInFlowchart !== false}
                            onChange={(e) => updateNode(task.id, "showInFlowchart", e.target.checked)}
                            disabled={isReadOnly}
                            style={{ marginRight: "5px" }}
                          />
                          流程圖
                        </label>
                        <label style={{ display: "flex", alignItems: "center", fontSize: "12px" }}>
                          <input
                            type="checkbox"
                            checked={task.showForCustomer !== false}
                            onChange={(e) => updateNode(task.id, "showForCustomer", e.target.checked)}
                            disabled={isReadOnly}
                            style={{ marginRight: "5px" }}
                          />
                          顧客可見
                        </label>
                      </div>
                    </td>
                  </tr>
                ))
              }
              
              {/* 最後渲染其他類型的子元素 (subFlow, iterative, note, extra) */}
              {nodes
                .filter(n => 
                  n.type !== "phase" && n.type !== "task" && n.type !== "arrow" && 
                  String(n.containerId) === String(phase.id)
                )
                .map(otherNode => (
                  <tr key={otherNode.id}>
                    <td style={{ paddingLeft: `${paddingLeft + 20}px` }}>{otherNode.type}</td>
                    <td>
                      <input
                        type="text"
                        value={otherNode.label || ""}
                        onChange={(e) => updateNode(otherNode.id, "label", e.target.value)}
                        disabled={isReadOnly}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={otherNode.description || ""}
                        onChange={(e) => updateNode(otherNode.id, "description", e.target.value)}
                        disabled={isReadOnly}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={otherNode.link || ""}
                        onChange={(e) => updateNode(otherNode.id, "link", e.target.value)}
                        disabled={isReadOnly}
                      />
                    </td>
                    <td>
                      {otherNode.status ? (
                        <input
                          type="text"
                          value={otherNode.status || ""}
                          onChange={(e) => updateNode(otherNode.id, "status", e.target.value)}
                          disabled={isReadOnly}
                        />
                      ) : <span>-</span>}
                    </td>
                    <td>
                      {/* 其他元素暫無排序功能 */}
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        <label style={{ display: "flex", alignItems: "center", fontSize: "12px" }}>
                          <input
                            type="checkbox"
                            checked={otherNode.showInFlowchart !== false}
                            onChange={(e) => updateNode(otherNode.id, "showInFlowchart", e.target.checked)}
                            disabled={isReadOnly}
                            style={{ marginRight: "5px" }}
                          />
                          流程圖
                        </label>
                        <label style={{ display: "flex", alignItems: "center", fontSize: "12px" }}>
                          <input
                            type="checkbox"
                            checked={otherNode.showForCustomer !== false}
                            onChange={(e) => updateNode(otherNode.id, "showForCustomer", e.target.checked)}
                            disabled={isReadOnly}
                            style={{ marginRight: "5px" }}
                          />
                          顧客可見
                        </label>
                      </div>
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
              <th>顯示設定</th>
            </tr>
          </thead>
          <tbody>
            {/* 渲染頂層 Phase 及其所有子項目 */}
            {topLevelPhases.map(phase => renderPhaseWithChildren(phase))}
            
            {/* 顯示未歸屬於任何 Phase 的 Task */}
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
                      {/* 未分配的 Task 暫無排序功能 */}
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        <label style={{ display: "flex", alignItems: "center", fontSize: "12px" }}>
                          <input
                            type="checkbox"
                            checked={task.showInFlowchart !== false}
                            onChange={(e) => updateNode(task.id, "showInFlowchart", e.target.checked)}
                            disabled={isReadOnly}
                            style={{ marginRight: "5px" }}
                          />
                          流程圖
                        </label>
                        <label style={{ display: "flex", alignItems: "center", fontSize: "12px" }}>
                          <input
                            type="checkbox"
                            checked={task.showForCustomer !== false}
                            onChange={(e) => updateNode(task.id, "showForCustomer", e.target.checked)}
                            disabled={isReadOnly}
                            style={{ marginRight: "5px" }}
                          />
                          顧客可見
                        </label>
                      </div>
                    </td>
                  </tr>
                ))}
              </>
            )}
            
            {/* 顯示其他未分類的元素 */}
            {unassignedOthers.length > 0 && (
              <>
                <tr>
                  <td colSpan="7" style={{ backgroundColor: "#ccc", fontWeight: "bold" }}>
                    Other Unassigned Elements
                  </td>
                </tr>
                {unassignedOthers.map(node => (
                  <tr key={node.id}>
                    <td>{node.type}</td>
                    <td>
                      <input
                        type="text"
                        value={node.label || ""}
                        onChange={(e) => updateNode(node.id, "label", e.target.value)}
                        disabled={isReadOnly}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={node.description || ""}
                        onChange={(e) => updateNode(node.id, "description", e.target.value)}
                        disabled={isReadOnly}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={node.link || ""}
                        onChange={(e) => updateNode(node.id, "link", e.target.value)}
                        disabled={isReadOnly}
                      />
                    </td>
                    <td>
                      {node.status !== undefined ? (
                        <input
                          type="text"
                          value={node.status || ""}
                          onChange={(e) => updateNode(node.id, "status", e.target.value)}
                          disabled={isReadOnly}
                        />
                      ) : <span>-</span>}
                    </td>
                    <td>
                      {/* 其他元素暫無排序功能 */}
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        <label style={{ display: "flex", alignItems: "center", fontSize: "12px" }}>
                          <input
                            type="checkbox"
                            checked={node.showInFlowchart !== false}
                            onChange={(e) => updateNode(node.id, "showInFlowchart", e.target.checked)}
                            disabled={isReadOnly}
                            style={{ marginRight: "5px" }}
                          />
                          流程圖
                        </label>
                        <label style={{ display: "flex", alignItems: "center", fontSize: "12px" }}>
                          <input
                            type="checkbox"
                            checked={node.showForCustomer !== false}
                            onChange={(e) => updateNode(node.id, "showForCustomer", e.target.checked)}
                            disabled={isReadOnly}
                            style={{ marginRight: "5px" }}
                          />
                          顧客可見
                        </label>
                      </div>
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

  // 流程圖模式：只顯示 showInFlowchart 為 true 的節點，且客戶角色需考慮 showForCustomer 條件
  const renderFlowchartView = () => {
    // 篩選節點：考慮 showInFlowchart 和客戶角色下的 showForCustomer
    const visibleNodes = nodes.filter(node => {
      if (node.showInFlowchart === false) return false;
      if (isReadOnly && node.showForCustomer === false) return false;
      return true;
    });
    
    return (
      <div
        ref={containerRef}
        className="yuniver-flowchart-view"
        style={{
          position: "relative",
          width: "100%",
          height: "700px",
          border: "1px solid #e0e0e0",
          backgroundColor: "#fafafa",
          overflow: "auto"  // 允許滾動查看超出範圍的物件
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleContainerClick}
      >
{visibleNodes.map(node => {
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
  // 計算 z-index: 根據節點的巢狀層級來設定，越深層的節點 z-index 越高
  const getNodeDepth = (nodeId, depth = 0) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.containerId) return depth;
    return getNodeDepth(node.containerId, depth + 1);
  };
  
  // 計算正確的 z-index: phase 比 task 低，同時考慮巢狀深度
  // 反向思考：子元素需要比父元素更高的z-index才能顯示在上層
  const nodeDepth = getNodeDepth(node.id);
  const baseZIndex = node.type === "phase" ? 10 : (node.type === "task" ? 50 : 100);
  const zIndex = baseZIndex + nodeDepth * 10;
  return (
    <div
      key={node.id}
      style={{
        position: "absolute",
        left: node.position.x,
        top: node.position.y,
        width: node.size.width,
        height: node.size.height,
        border: selectedNodeId === node.id ? "2px solid red" : "1px solid rgba(0, 0, 0, 0.1)",
        boxSizing: "border-box",
        borderRadius: "3px",
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
      onDoubleClick={(e) => handleDoubleClick(e, node.id)}
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
  };

  return (
    <div className="yuniver-container">


      <div className="yuniver-content">
        <div className="main-content">          
          <div className="yuniver-flowchart-container">
            <div className="yuniver-flowchart-header" style={{ position: "fixed",paddingLeft:30,left:0, top: 0, zIndex: 990,width: "100%" }}>
              {renderHeader()}
            </div>
            
            <div className="yuniver-flowchart-content" style={{ paddingTop: "60px" }}>
              {displayMode === "flowchart" ? renderFlowchartView() : renderListView()}
              
              {/* 編輯彈窗 */}
              {editingPopupNode && (
                <div 
                  ref={popupRef}
                  className="node-edit-popup"
                  style={{ left: `${popupPosition.x}px`, top: `${popupPosition.y}px` }}
                >
                  <div className="popup-header">
                    <h3>編輯 {editingPopupNode.type}</h3>
                    <button onClick={closePopup} className="popup-close-btn">✖</button>
                  </div>
                  
                  <div className="popup-field">
                    <label>標籤：</label>
                    <input
                      type="text"
                      name="label"
                      value={editingPopupNode.label || ''}
                      onChange={(e) => {
                        const { name, value } = e.target;
                        setEditingPopupNode(prev => ({ ...prev, [name]: value }));
                        setNodes(prevNodes => {
                          const newNodes = prevNodes.map(n => 
                            n.id === editingPopupNode.id ? { ...n, [name]: value } : n
                          );
                          setHasUnsavedChanges(true);
                          return newNodes;
                        });
                        autoSave();
                      }}
                    />
                  </div>
                  
                  <div className="popup-field">
                    <label>描述：</label>
                    <textarea
                      name="description"
                      value={editingPopupNode.description || ''}
                      onChange={(e) => {
                        const { name, value } = e.target;
                        setEditingPopupNode(prev => ({ ...prev, [name]: value }));
                        setNodes(prevNodes => {
                          const newNodes = prevNodes.map(n => 
                            n.id === editingPopupNode.id ? { ...n, [name]: value } : n
                          );
                          setHasUnsavedChanges(true);
                          return newNodes;
                        });
                        autoSave();
                      }}
                    />
                  </div>
                  
                  {(editingPopupNode.type === 'phase' || editingPopupNode.type === 'task') && (
                    <div className="popup-field">
                      <label>狀態：</label>
                      <select
                        name="status"
                        value={editingPopupNode.status || '未開始'}
                        onChange={(e) => {
                          const { name, value } = e.target;
                          setEditingPopupNode(prev => ({ ...prev, [name]: value }));
                          setNodes(prevNodes => {
                            const newNodes = prevNodes.map(n => 
                              n.id === editingPopupNode.id ? { ...n, [name]: value } : n
                            );
                            setHasUnsavedChanges(true);
                            return newNodes;
                          });
                          autoSave();
                        }}
                      >
                        <option value="未開始">未開始</option>
                        <option value="規劃中">規劃中</option>
                        <option value="進行中">進行中</option>
                        <option value="已完成">已完成</option>
                        <option value="自訂">自訂</option>
                      </select>
                    </div>
                  )}
                  
                  {editingPopupNode.status === '自訂' && (
                    <div className="popup-field">
                      <label>自訂狀態：</label>
                      <input
                        type="text"
                        name="customStatus"
                        value={editingPopupNode.customStatus || ''}
                        onChange={(e) => {
                          const { name, value } = e.target;
                          setEditingPopupNode(prev => ({ ...prev, [name]: value }));
                          setNodes(prevNodes => {
                            const newNodes = prevNodes.map(n => 
                              n.id === editingPopupNode.id ? { ...n, [name]: value } : n
                            );
                            setHasUnsavedChanges(true);
                            return newNodes;
                          });
                          autoSave();
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="popup-field">
                    <label>連結：</label>
                    <input
                      type="text"
                      name="link"
                      value={editingPopupNode.link || ''}
                      onChange={(e) => {
                        const { name, value } = e.target;
                        setEditingPopupNode(prev => ({ ...prev, [name]: value }));
                        setNodes(prevNodes => {
                          const newNodes = prevNodes.map(n => 
                            n.id === editingPopupNode.id ? { ...n, [name]: value } : n
                          );
                          setHasUnsavedChanges(true);
                          return newNodes;
                        });
                        autoSave();
                      }}
                    />
                  </div>
                  
                  {(editingPopupNode.type === 'phase' || editingPopupNode.type === 'task') && (
                    <div className="popup-field">
                      <label>形狀：</label>
                      <select
                        name="shape"
                        value={editingPopupNode.shape || 'rectangle'}
                        onChange={(e) => {
                          const { name, value } = e.target;
                          setEditingPopupNode(prev => ({ ...prev, [name]: value }));
                          setNodes(prevNodes => {
                            const newNodes = prevNodes.map(n => 
                              n.id === editingPopupNode.id ? { ...n, [name]: value } : n
                            );
                            setHasUnsavedChanges(true);
                            return newNodes;
                          });
                          autoSave();
                        }}
                      >
                        <option value="rectangle">矩形</option>
                        <option value="ellipse">橢圓形</option>
                        <option value="parallelogram">平行四邊形</option>
                        <option value="diamond">菱形</option>
                      </select>
                    </div>
                  )}
                  
                  {editingPopupNode.type === 'task' && (
                    <div className="popup-field popup-checkbox">
                      <label>
                        <input
                          type="checkbox"
                          name="important"
                          checked={editingPopupNode.important || false}
                          onChange={(e) => {
                            const { name, checked } = e.target;
                            setEditingPopupNode(prev => ({ ...prev, [name]: checked }));
                            setNodes(prevNodes => {
                              const newNodes = prevNodes.map(n => 
                                n.id === editingPopupNode.id ? { ...n, [name]: checked } : n
                              );
                              setHasUnsavedChanges(true);
                              return newNodes;
                            });
                            autoSave();
                          }}
                        />
                        重要任務
                      </label>
                    </div>
                  )}
                  
                  <div className="popup-field">
                    <div className="popup-checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          name="showInFlowchart"
                          checked={editingPopupNode.showInFlowchart !== false}
                          onChange={(e) => {
                            const { name, checked } = e.target;
                            // 更新當前節點狀態
                            setEditingPopupNode(prev => ({ ...prev, [name]: checked }));
                            
                            // 更新所有節點，包括級聯更新子元素
                            if (editingPopupNode.type === "phase") {
                              // 使用現有的 handleEditChange 函數來級聯更新子元素
                              const event = { target: { name, value: checked } };
                              setSelectedNodeId(editingPopupNode.id);
                              handleEditChange(event);
                            } else {
                              // 非 phase 節點只更新自己
                              setNodes(prevNodes => {
                                const newNodes = prevNodes.map(n => 
                                  n.id === editingPopupNode.id ? { ...n, [name]: checked } : n
                                );
                                setHasUnsavedChanges(true);
                                return newNodes;
                              });
                            }
                            autoSave();
                          }}
                        />
                        在流程圖中顯示
                      </label>
                      
                      <label>
                        <input
                          type="checkbox"
                          name="showForCustomer"
                          checked={editingPopupNode.showForCustomer !== false}
                          onChange={(e) => {
                            const { name, checked } = e.target;
                            // 更新當前節點狀態
                            setEditingPopupNode(prev => ({ ...prev, [name]: checked }));
                            
                            // 更新所有節點，包括級聯更新子元素
                            if (editingPopupNode.type === "phase") {
                              // 使用現有的 handleEditChange 函數來級聯更新子元素
                              const event = { target: { name, value: checked } };
                              setSelectedNodeId(editingPopupNode.id);
                              handleEditChange(event);
                            } else {
                              // 非 phase 節點只更新自己
                              setNodes(prevNodes => {
                                const newNodes = prevNodes.map(n => 
                                  n.id === editingPopupNode.id ? { ...n, [name]: checked } : n
                                );
                                setHasUnsavedChanges(true);
                                return newNodes;
                              });
                            }
                            autoSave();
                          }}
                        />
                        顧客可見
                      </label>
                    </div>
                  </div>
                  
                  <div className="popup-actions">
                    <button 
                      onClick={closePopup}
                      className="popup-done-btn"
                    >
                      完成
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* 原先的屬性面板已移至彈窗 */}
        </div>
      </div>
    </div>
  );
};

export default CustomFlowChartEditor;




