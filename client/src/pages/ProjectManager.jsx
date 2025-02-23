import React, { useEffect, useState } from "react";
import {
  fetchAllProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../api/project";
import { getAllUsers } from "../api/user"; // 取得使用者清單
import { useNavigate } from "react-router-dom";

function ProjectManager() {
  const [projects, setProjects] = useState([]);
  const [editProjectId, setEditProjectId] = useState(null);
  const [formData, setFormData] = useState({
    clientName: "",
    projectName: "",
    owner: "", // 這裡將放使用者的 _id
    startDate: "",
    endDate: "",
  });
  const [users, setUsers] = useState([]); // 下拉使用者列表

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // 一進來就同時載入 "所有專案" & "使用者清單"
  useEffect(() => {
    loadProjects();
    loadUsers();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await fetchAllProjects(token);
      setProjects(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await getAllUsers(token);
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      clientName: formData.clientName,
      projectName: formData.projectName,
      owner: formData.owner, // 這裡就是 _id
      period: {
        startDate: formData.startDate,
        endDate: formData.endDate,
      },
    };

    try {
      if (editProjectId) {
        // 更新
        await updateProject(editProjectId, payload, token);
        alert("專案更新成功");
      } else {
        // 新建
        await createProject(payload, token);
        alert("專案建立成功");
      }
      // 清空表單
      setFormData({
        clientName: "",
        projectName: "",
        owner: "",
        startDate: "",
        endDate: "",
      });
      setEditProjectId(null);
      loadProjects();
    } catch (err) {
      console.error("Create/Update Project Error", err);
      alert("操作失敗");
    }
  };

  const handleEdit = (proj) => {
    setEditProjectId(proj._id);
    setFormData({
      clientName: proj.clientName,
      projectName: proj.projectName,
      owner: proj.owner?._id || "", // 這裡讀取後端 populate 回來的 owner
      startDate: proj.period?.startDate?.slice(0, 10) || "",
      endDate: proj.period?.endDate?.slice(0, 10) || "",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("確定要刪除？")) return;
    try {
      await deleteProject(id, token);
      alert("刪除成功");
      loadProjects();
    } catch (err) {
      console.error(err);
      alert("刪除失敗");
    }
  };

  // 跳轉至專案設定頁面
  const handleGoToSettings = (projectId) => {
    navigate(`/project-settings/${projectId}`);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>專案管理 (CRUD + 下拉選單指派負責人)</h2>

      {/* 專案清單 */}
      <table border="1" cellPadding="8" style={{ marginTop: "20px" }}>
        <thead>
          <tr>
            <th>客戶名稱</th>
            <th>專案名稱</th>
            <th>負責人</th>
            <th>開始 ~ 結束</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((proj) => (
            <tr key={proj._id}>
              <td>{proj.clientName}</td>
              <td>{proj.projectName}</td>
              <td>{proj.owner?.username || "N/A"}</td>
              <td>
                {proj.period?.startDate
                  ? new Date(proj.period.startDate).toLocaleDateString()
                  : ""}{" "}
                ~{" "}
                {proj.period?.endDate
                  ? new Date(proj.period.endDate).toLocaleDateString()
                  : ""}
              </td>
              <td>
                <button onClick={() => handleEdit(proj)}>編輯</button>{" "}
                <button onClick={() => handleDelete(proj._id)}>刪除</button>{" "}
                <button onClick={() => handleGoToSettings(proj._id)}>
                  設定
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />

      {/* 新增 / 編輯 表單 */}
      <h3>{editProjectId ? "編輯專案" : "新增專案"}</h3>
      <form onSubmit={handleFormSubmit}>
        <div>
          <label>客戶名稱: </label>
          <input
            value={formData.clientName}
            onChange={(e) =>
              setFormData({ ...formData, clientName: e.target.value })
            }
            required
          />
        </div>
        <div>
          <label>專案名稱: </label>
          <input
            value={formData.projectName}
            onChange={(e) =>
              setFormData({ ...formData, projectName: e.target.value })
            }
            required
          />
        </div>
        {/* 下拉選單 (Select) for 負責人 */}
        <div>
          <label>負責人: </label>
          <select
            value={formData.owner}
            onChange={(e) =>
              setFormData({ ...formData, owner: e.target.value })
            }
          >
            <option value="">請選擇負責人</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.username}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>開始日期: </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) =>
              setFormData({ ...formData, startDate: e.target.value })
            }
          />
        </div>
        <div>
          <label>結束日期: </label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) =>
              setFormData({ ...formData, endDate: e.target.value })
            }
          />
        </div>
        <button type="submit" style={{ marginTop: "10px" }}>
          {editProjectId ? "更新" : "新增"}
        </button>
      </form>
    </div>
  );
}

export default ProjectManager;
