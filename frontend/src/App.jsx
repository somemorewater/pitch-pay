import { useState, createContext, useContext, useEffect } from "react";
import PublicDashboard from "./pages/PublicDashboard";
import Squad from "./pages/Squad";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("pp_token") || null);
  const [admin, setAdmin] = useState(JSON.parse(localStorage.getItem("pp_admin") || "null"));
  const [view, setView] = useState("public");

  const login = (token, admin) => {
    setToken(token); setAdmin(admin);
    localStorage.setItem("pp_token", token);
    localStorage.setItem("pp_admin", JSON.stringify(admin));
    setView("admin");
  };

  const logout = () => {
    setToken(null); setAdmin(null);
    localStorage.removeItem("pp_token");
    localStorage.removeItem("pp_admin");
    setView("public");
  };

  const now = new Date();
  const monthLabel = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <AuthContext.Provider value={{ token, admin, login, logout, isAdmin: !!token }}>
      <div className="app">
        <nav className="topbar">
          <div className="logo">
            <div className="logo-dot">⚽</div>
            PitchPay
          </div>
          <div className="nav-links">
            <button className={`nav-btn ${view === "public" ? "active" : ""}`} onClick={() => setView("public")}>Overview</button>
            <button className={`nav-btn ${view === "squad" ? "active" : ""}`} onClick={() => setView("squad")}>Squad</button>
            <button className={`nav-btn ${view === "admin" ? "active" : ""}`} onClick={() => setView("admin")}>Admin</button>
          </div>
          <div className="topbar-right">
            <span className="month-badge">{monthLabel}</span>
            {token
              ? <button className="login-btn" onClick={logout}>Logout</button>
              : <button className="login-btn" onClick={() => setView("admin")}>Login</button>
            }
          </div>
        </nav>

        <main className="main-content">
          {view === "public" && <PublicDashboard />}
          {view === "squad" && <Squad />}
          {view === "admin" && !token && <AdminLogin onSuccess={login} />}
          {view === "admin" && token && <AdminDashboard />}
        </main>
      </div>
    </AuthContext.Provider>
  );
}
