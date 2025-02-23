// src/pages/UserManagement.jsx
import React, { useState, useEffect } from "react";
import { getUsers, createUser, updateUser, deleteUser } from "../api/user";
import { useNavigate } from "react-router-dom";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [newUserData, setNewUserData] = useState({
    username: "",
    password: "",
    role: "customer",
    name: "",
    email: "",
    selfIntro: "",
    note: "",
    phone: "",
    company: "",
  });
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getUsers(token);
      setUsers(data);
    } catch (error) {
      console.error("Load users error:", error);
    }
  };

  const handleEditChange = (e) => {
    setEditingUser({ ...editingUser, [e.target.name]: e.target.value });
  };

  const handleNewUserChange = (e) => {
    setNewUserData({ ...newUserData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      await updateUser(editingUser._id, editingUser, token);
      loadUsers();
      setEditingUser(null);
    } catch (error) {
      console.error("Update user error:", error);
      alert("Update failed");
    }
  };

  const handleCreate = async () => {
    try {
      await createUser(newUserData, token);
      loadUsers();
      setNewUserData({
        username: "",
        password: "",
        role: "customer",
        name: "",
        email: "",
        selfIntro: "",
        note: "",
        phone: "",
        company: "",
      });
      alert("User created successfully");
    } catch (error) {
      console.error("Create user error:", error);
      alert("User creation failed");
    }
  };

  const handleDelete = async (userId) => {
    try {
      await deleteUser(userId, token);
      loadUsers();
    } catch (error) {
      console.error("Delete user error:", error);
      alert("Delete failed");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>User Management</h2>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Username</th>
            <th>Role</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Company</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>{u.username}</td>
              <td>{u.role}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.phone}</td>
              <td>{u.company}</td>
              <td>
                <button onClick={() => setEditingUser(u)}>Edit</button>
                <button
                  onClick={() => handleDelete(u._id)}
                  style={{ marginLeft: "5px" }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingUser && (
        <div
          style={{
            marginTop: "20px",
            border: "1px solid #ccc",
            padding: "10px",
          }}
        >
          <h3>Edit User</h3>
          <div>
            <label>Username:</label>
            <input name="username" value={editingUser.username} disabled />
          </div>
          <div>
            <label>Name:</label>
            <input
              name="name"
              value={editingUser.name || ""}
              onChange={handleEditChange}
            />
          </div>
          <div>
            <label>Email:</label>
            <input
              name="email"
              value={editingUser.email || ""}
              onChange={handleEditChange}
            />
          </div>
          <div>
            <label>Phone:</label>
            <input
              name="phone"
              value={editingUser.phone || ""}
              onChange={handleEditChange}
            />
          </div>
          <div>
            <label>Company:</label>
            <input
              name="company"
              value={editingUser.company || ""}
              onChange={handleEditChange}
            />
          </div>
          <div>
            <label>Role:</label>
            <select
              name="role"
              value={editingUser.role}
              onChange={handleEditChange}
            >
              <option value="god">God</option>
              <option value="admin">Admin</option>
              <option value="employee">Employee</option>
              <option value="customer">Customer</option>
            </select>
          </div>
          <div>
            <label>Self Intro:</label>
            <textarea
              name="selfIntro"
              value={editingUser.selfIntro || ""}
              onChange={handleEditChange}
            />
          </div>
          <div>
            <label>Note:</label>
            <textarea
              name="note"
              value={editingUser.note || ""}
              onChange={handleEditChange}
            />
          </div>
          <button onClick={handleUpdate}>Save</button>
          <button
            onClick={() => setEditingUser(null)}
            style={{ marginLeft: "10px" }}
          >
            Cancel
          </button>
        </div>
      )}

      <div
        style={{ marginTop: "20px", border: "1px solid #ccc", padding: "10px" }}
      >
        <h3>Create New User</h3>
        <div>
          <label>Username:</label>
          <input
            name="username"
            value={newUserData.username}
            onChange={handleNewUserChange}
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            name="password"
            type="password"
            value={newUserData.password}
            onChange={handleNewUserChange}
          />
        </div>
        <div>
          <label>Name:</label>
          <input
            name="name"
            value={newUserData.name}
            onChange={handleNewUserChange}
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            name="email"
            value={newUserData.email}
            onChange={handleNewUserChange}
          />
        </div>
        <div>
          <label>Phone:</label>
          <input
            name="phone"
            value={newUserData.phone}
            onChange={handleNewUserChange}
          />
        </div>
        <div>
          <label>Company:</label>
          <input
            name="company"
            value={newUserData.company}
            onChange={handleNewUserChange}
          />
        </div>
        <div>
          <label>Role:</label>
          <select
            name="role"
            value={newUserData.role}
            onChange={handleNewUserChange}
          >
            <option value="customer">Customer</option>
            <option value="employee">Employee</option>
            {/* 只有god可以建立admin用戶，此處前端僅做展示，實際權限檢查在後端 */}
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label>Self Intro:</label>
          <textarea
            name="selfIntro"
            value={newUserData.selfIntro}
            onChange={handleNewUserChange}
          />
        </div>
        <div>
          <label>Note:</label>
          <textarea
            name="note"
            value={newUserData.note}
            onChange={handleNewUserChange}
          />
        </div>
        <button onClick={handleCreate}>Create User</button>
      </div>
    </div>
  );
}

export default UserManagement;
