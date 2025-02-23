// src/pages/CustomFlowChartEditor.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

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
  const { id: projectId } = useParams();
  const token = localStorage.getItem('token');
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
  const containerRef = useRef(null);

  // 節點資料，包含 id, type, label, description, link, extras, children, containerId, position, size, status, customStatus, shape
  const [nodes, setNodes] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [resizingNodeId, setResizingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // 讀取後端流程圖資料
  useEffect(() => {
    const fetchFlowChart = async () => {
      try {
        const res = await axios.get(`${API_URL}/projects/${projectId}/flowchart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (res.data || []).map(item => ({
          ...item,
          position: item.position || { x: 50, y: 50 },
          size: item.size || { width: NODE_WIDTH_DEFAULT, height: NODE_HEIGHT_DEFAULT },
          containerId: item.containerId || null,
          children: item.children || [],
          status: (item.type === "phase" || item.type === "task") ? (item.status || "未開始") : item.status,
          shape: (item.type === "phase" || item.type === "task") ? (item.shape || "rectangle") : item.shape
        }));
        setNodes(data);
      } catch (error) {
        console.error("Failed to load flowchart:", error);
      }
    };
    fetchFlowChart();
  }, [projectId, API_URL, token]);

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

  // 拖曳開始
  const handleMouseDown = (e, nodeId) => {
    e.stopPropagation();
    const nodeElem = e.currentTarget;
    const rect = nodeElem.getBoundingClientRect();
    setDraggingNodeId(nodeId);
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  // 拖曳移動：更新拖曳節點及所有後代（遞迴更新）
  const handleMouseMove = (e) => {
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

  // 拖曳/縮放結束：檢查是否落入 Phase 或 Task 節點內，更新 containerId 與父節點 children
  const handleMouseUp = () => {
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

  // 節點選取
  const handleSelectNode = (e, nodeId) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
  };

  // 開始縮放（點擊右下角手把）
  const handleResizeMouseDown = (e, nodeId) => {
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

  // 刪除節點
  const handleDeleteNode = () => {
    if (!selectedNodeId) return;
    setNodes(prevNodes =>
      prevNodes.filter(n => n.id !== selectedNodeId)
        .map(n => n.containerId === selectedNodeId ? { ...n, containerId: null } : n)
    );
    setSelectedNodeId(null);
  };

  // 新增節點：根據 type 新增，並預設對於 phase 與 task 加入 shape（預設為 rectangle）
  const handleAddNewNode = (type = "task") => {
    const newNode = {
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
      shape: (type === "phase" || type === "task") ? "rectangle" : ""
    };
    setNodes(prev => [...prev, newNode]);
  };

  // 儲存流程圖至後端
  const handleSave = async () => {
    try {
      await axios.put(`${API_URL}/projects/${projectId}/flowchart`,
        { flowChart: nodes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Flowchart saved successfully!");
    } catch (error) {
      console.error("Failed to save flowchart:", error);
      alert("Save failed.");
    }
  };

  // 下載流程圖 JSON 檔案
const handleDownloadFlowchart = () => {
    // 使用 prompt 讓使用者輸入模板名稱，預設為 "Flowchart Template {projectId}"
    const templateName = prompt("請輸入模板名稱：", `Flowchart Template ${projectId}`);
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
  

  // 上傳流程圖 JSON 檔案並套用
  const handleUploadFlowchart = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        setNodes(json);
      } catch (error) {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <h2>Custom Flow Chart Editor</h2>
      <div style={{ marginBottom: "10px" }}>
        <button onClick={() => handleAddNewNode("task")}>Add Task</button>
        <button onClick={() => handleAddNewNode("phase")} style={{ marginLeft: "10px" }}>Add Phase</button>
        <button onClick={handleSave} style={{ marginLeft: "10px" }}>Save Flow Chart</button>
        <button onClick={handleDownloadFlowchart} style={{ marginLeft: "10px" }}>Download Flowchart</button>
        <label style={{ marginLeft: "10px" }}>
          Import Flowchart:
          <input type="file" accept=".json" onChange={handleUploadFlowchart} style={{ marginLeft: "5px" }} />
        </label>
      </div>
      <div
        ref={containerRef}
        style={{ position: "relative", width: "100%", height: "600px", border: "1px solid #ccc", backgroundColor: "#fafafa" }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {nodes.map(node => {
          const zIndex = node.containerId ? 10 : (node.type === "phase" || node.type === "task" ? 5 : 1);
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
                backgroundColor: (node.type === "phase" || node.type === "task") ? getStatusColor(node) : "#fff",
                cursor: "move",
                zIndex,
                ...getShapeStyle(node.shape)
              }}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
              onClick={(e) => handleSelectNode(e, node.id)}
            >
              {renderNodeContent(node)}
              {selectedNodeId === node.id && (
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
      {selectedNode && (
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
