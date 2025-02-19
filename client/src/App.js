import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import MailPage from './pages/MailPage';
import InternalFilesPage from './pages/InternalFilesPage';
import ProjectList from './pages/ProjectList';
import ProjectDetails from './pages/ProjectDetails';
import ProjectManager from './pages/ProjectManager';
import QuotationPage from './pages/QuotationPage';

// 簡易判斷是否已登入
const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* 未登入時，導向 /login */}
        <Route
          path="/"
          element={
            isAuthenticated() ? <Navigate to="/home" /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/login"
          element={isAuthenticated() ? <Navigate to="/home" /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated() ? <Navigate to="/home" /> : <RegisterPage />}
        />
        
        {/* 已登入路由 */}
        <Route 
          path="/home" 
          element={isAuthenticated() ? <HomePage /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/mail" 
          element={isAuthenticated() ? <MailPage /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/internal-files"
          element={isAuthenticated() ? <InternalFilesPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/projects"
          element={isAuthenticated() ? <ProjectList /> : <Navigate to="/login" />}
        />
        <Route
          path="/projects/:id"
          element={isAuthenticated() ? <ProjectDetails /> : <Navigate to="/login" />}
        />
        <Route
          path="/project-manager"
          element={isAuthenticated() ? <ProjectManager /> : <Navigate to="/login" />}
        />
        <Route
          path="/quotation"
          element={isAuthenticated() ? <QuotationPage /> : <Navigate to="/login" />}
        />

        {/* 404 處理，或直接導向 /home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
