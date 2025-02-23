// src/pages/ProjectSettings.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getProjectDetails, updateProjectSettings } from "../api/project";
import { getAllUsers } from "../api/user";

function ProjectSettings() {
  const { id } = useParams();
  const token = localStorage.getItem("token");

  // 儲存專案基本資訊
  const [formData, setFormData] = useState({
    clientName: "",
    projectName: "",
    startDate: "",
    endDate: "",
  });
  // 儲存存取設定 (accessControl)，格式為 [{ user: <userId>, access: "edit" 或 "view" }, ...]
  const [accessList, setAccessList] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadProject();
    loadUsers();
  }, [id]);

  const loadProject = async () => {
    try {
      const data = await getProjectDetails(id, token);
      setFormData({
        clientName: data.clientName,
        projectName: data.projectName,
        startDate: data.period?.startDate
          ? data.period.startDate.slice(0, 10)
          : "",
        endDate: data.period?.endDate ? data.period.endDate.slice(0, 10) : "",
      });
      setAccessList(data.accessControl || []);
    } catch (error) {
      console.error("Load project error:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await getAllUsers(token);
      setUsers(data);
    } catch (error) {
      console.error("Load users error:", error);
    }
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddAccess = () => {
    setAccessList([...accessList, { user: "", access: "view" }]);
  };

  const handleAccessChange = (index, field, value) => {
    const newList = [...accessList];
    newList[index][field] = value;
    setAccessList(newList);
  };

  const handleRemoveAccess = (index) => {
    const newList = accessList.filter((_, i) => i !== index);
    setAccessList(newList);
  };

  const handleSaveSettings = async () => {
    try {
      const payload = {
        clientName: formData.clientName,
        projectName: formData.projectName,
        period: {
          startDate: formData.startDate,
          endDate: formData.endDate,
        },
        accessControl: accessList,
      };
      await updateProjectSettings(id, payload, token);
      alert("設定更新成功");
    } catch (error) {
      if (error.response && error.response.status === 403) {
        alert("權限不足：只有 God 或 Admin 可以修改存取設定");
      } else {
        alert("設定更新失敗");
      }
      console.error("Update settings error:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>案件資訊設定</h2>
      <h3>基本資訊</h3>
      <div>
        <label>客戶名稱:</label>
        <input
          name="clientName"
          value={formData.clientName}
          onChange={handleFormChange}
          style={{ marginLeft: "10px" }}
        />
      </div>
      <div>
        <label>專案名稱:</label>
        <input
          name="projectName"
          value={formData.projectName}
          onChange={handleFormChange}
          style={{ marginLeft: "10px" }}
        />
      </div>
      <div>
        <label>開始日期:</label>
        <input
          type="date"
          name="startDate"
          value={formData.startDate}
          onChange={handleFormChange}
          style={{ marginLeft: "10px" }}
        />
      </div>
      <div>
        <label>結束日期:</label>
        <input
          type="date"
          name="endDate"
          value={formData.endDate}
          onChange={handleFormChange}
          style={{ marginLeft: "10px" }}
        />
      </div>

      <h3>存取設定</h3>
      <table border="1" cellPadding="5" style={{ marginBottom: "10px" }}>
        <thead>
          <tr>
            <th>使用者</th>
            <th>權限</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {accessList.map((item, index) => (
            <tr key={index}>
              <td>
                <select
                  value={item.user}
                  onChange={(e) =>
                    handleAccessChange(index, "user", e.target.value)
                  }
                >
                  <option value="">請選擇用戶</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.username}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  value={item.access}
                  onChange={(e) =>
                    handleAccessChange(index, "access", e.target.value)
                  }
                >
                  <option value="edit">可編輯</option>
                  <option value="view">僅查看</option>
                </select>
              </td>
              <td>
                <button onClick={() => handleRemoveAccess(index)}>刪除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleAddAccess}>新增存取權限</button>
      <br />
      <button onClick={handleSaveSettings} style={{ marginTop: "10px" }}>
        儲存設定
      </button>
    </div>
  );
}

export default ProjectSettings;
