import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import MailPage from "./pages/MailPage";
import InternalFilesPage from "./pages/InternalFilesPage";
import ProjectList from "./pages/ProjectList";
import ProjectDetailsWithFiles from "./pages/ProjectDetailsWithFiles";
import ProjectManager from "./pages/ProjectManager";
import QuotationPage from "./pages/QuotationPage";
import CustomFlowChartEditor from "./pages/CustomFlowChartEditor";
import TemplateLibrary from "./pages/TemplateLibrary";
import UserManagement from "./pages/UserManagement";
import ProjectSettings from "./pages/ProjectSettings";

// 簡易判斷是否已登入並取得用戶角色
const getRole = () => {
  const token = localStorage.getItem("token");
  if (token) {
    const decodedToken = JSON.parse(atob(token.split(".")[1])); // 解碼 JWT Token
    console.log("Decoded Token:", decodedToken); // 輸出解碼後的 token，檢查 role 是否存在
    return decodedToken.role || null; // 確保返回角色
  }
  return null;
};

// 角色權限控制函數
const hasAccess = (role, allowedRoles) => {
  return allowedRoles.includes(role);
};

const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  return !!token; // Returns true if token exists
};

function App() {
  const role = getRole(); // 取得用戶角色

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated() ? (
              <Navigate to="/home" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/login"
          element={role ? <Navigate to="/home" /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={role ? <Navigate to="/home" /> : <RegisterPage />}
        />

        {/* 根據角色控制訪問頁面 */}
        <Route
          path="/home"
          element={
            hasAccess(role, ["god", "admin", "employee", "customer"]) ? (
              <HomePage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/mail"
          element={
            hasAccess(role, ["god", "admin", "employee"]) ? (
              <MailPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/internal-files"
          element={
            hasAccess(role, ["god", "admin", "employee"]) ? (
              <InternalFilesPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/projects"
          element={
            hasAccess(role, ["god", "admin", "employee", "customer"]) ? (
              <ProjectList />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/projects/:id"
          element={
            hasAccess(role, ["god", "admin", "employee", "customer"]) ? (
              <ProjectDetailsWithFiles />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/project-manager"
          element={
            hasAccess(role, ["god", "admin"]) ? (
              <ProjectManager />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/quotation"
          element={
            hasAccess(role, ["god", "admin", "employee"]) ? (
              <QuotationPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/flowchart-editor/:id"
          element={
            hasAccess(role, ["god", "admin", "employee", "customer"]) ? (
              <CustomFlowChartEditor />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/template-library"
          element={
            hasAccess(role, ["god", "admin"]) ? (
              <TemplateLibrary />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/UserManagement"
          element={
            hasAccess(role, ["god", "admin"]) ? (
              <UserManagement />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/project-settings/:id"
          element={
            hasAccess(role, ["god", "admin"]) ? (
              <ProjectSettings />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
