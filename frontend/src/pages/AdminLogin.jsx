import { useState } from "react";
import { api } from "../lib/api";

export default function AdminLogin({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) return setError("Enter username and password");
    setLoading(true); setError("");
    try {
      const data = await api.post("/admin/login", { username, password });
      onSuccess(data.token, data.admin);
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-box">
        <h2>Admin login</h2>
        <p>Enter your credentials to manage the team</p>
        {error && <div className="error-msg">{error}</div>}
        <div className="input-group">
          <label className="input-label">Username</label>
          <input className="pp-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" />
        </div>
        <div className="input-group">
          <label className="input-label">Password</label>
          <input className="pp-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>
        <button className="btn-primary" style={{ width: "100%" }} onClick={handleLogin} disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <p className="login-hint">Default: admin / admin123 (after seeding)</p>
      </div>
    </div>
  );
}
