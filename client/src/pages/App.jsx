//client/src/pages/App.jsx
import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from "react-router-dom";
import { getUserRole } from "./api/user"; 
import ProjectManager from "./pages/ProjectManager";
import IdentityManagement from "./pages/IdentityManagement";
import ProjectList from "./pages/ProjectList";
import Mail from "./pages/Mail";
import InternalFiles from "./pages/InternalFiles";

function App() {
  const [role, setRole] = useState(null);

  // 後端獲取用戶角色資訊
  useEffect(() => {
    const fetchRole = async () => {
      try {
        const user = await getUserRole(); 
        setRole(user.role);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRole();
  }, []);

  // 判斷角色對應的頁面
  const renderRoute = (Component, allowedRoles) => {
    return allowedRoles.includes(role) ? <Component /> : <Redirect to="/" />;
  };

  return (
    <Router>
      <Switch>
        <Route exact path="/">
          <h1>Welcome to the Dashboard</h1>
        </Route>

        {/* 不同角色可以訪問的頁面 */}
        {role === "god" || role === "admin" ? (
          <>
            <Route path="/project-manager" component={ProjectManager} />
            <Route path="/identity-management" component={IdentityManagement} />
          </>
        ) : null}

        {role === "god" || role === "admin" || role === "employee" ? (
          <>
            <Route path="/mail" component={Mail} />
            <Route path="/internal-files" component={InternalFiles} />
          </>
        ) : null}

        {role === "god" ||
        role === "admin" ||
        role === "employee" ||
        role === "customer" ? (
          <Route path="/project-list" component={ProjectList} />
        ) : null}
      </Switch>
    </Router>
  );
}

export default App;
