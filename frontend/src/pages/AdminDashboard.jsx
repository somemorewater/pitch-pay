import { useState, useEffect } from "react";
import { useAuth } from "../App";
import { api, fmt, MONTHS_FULL, MONTHS } from "../lib/api";
import Avatar from "../components/Avatar";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const TABS = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "players", label: "Players", icon: "👥" },
  { id: "payments", label: "Payments", icon: "💳" },
  { id: "expenses", label: "Expenses", icon: "🧾" },
  { id: "analytics", label: "Analytics", icon: "📈" },
];

export default function AdminDashboard() {
  const { token } = useAuth();
  const [tab, setTab] = useState("overview");
  const [dashboard, setDashboard] = useState(null);
  const [players, setPlayers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payMonth, setPayMonth] = useState(new Date().getMonth() + 1);
  const [payYear, setPayYear] = useState(new Date().getFullYear());

  // New player form
  const [newName, setNewName] = useState("");
  const [newJersey, setNewJersey] = useState("");
  const [newPos, setNewPos] = useState("Midfielder");
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  // New expense form
  const [expTitle, setExpTitle] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(new Date().toISOString().split("T")[0]);
  const [expDesc, setExpDesc] = useState("");
  const [showAddExpense, setShowAddExpense] = useState(false);

  const [msg, setMsg] = useState("");

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  useEffect(() => { loadDashboard(); loadPlayers(); }, []);
  useEffect(() => { if (tab === "payments") loadPayments(); }, [tab, payMonth, payYear]);
  useEffect(() => { if (tab === "expenses") loadExpenses(); }, [tab]);

  const loadDashboard = async () => {
    try { setDashboard(await api.get("/admin/dashboard", token)); } catch {}
  };
  const loadPlayers = async () => {
    try { const d = await api.get("/admin/players", token); setPlayers(d.players || []); } catch {}
  };
  const loadPayments = async () => {
    try { const d = await api.get(`/admin/payments?month=${payMonth}&year=${payYear}`, token); setPayments(d.payments || []); } catch {}
  };
  const loadExpenses = async () => {
    try { const d = await api.get("/admin/expenses", token); setExpenses(d.expenses || []); } catch {}
  };

  const addPlayer = async () => {
    if (!newName || !newJersey) return;
    try {
      await api.post("/admin/players", { full_name: newName, jersey_number: parseInt(newJersey), position: newPos }, token);
      setNewName(""); setNewJersey(""); setShowAddPlayer(false);
      loadPlayers(); flash("Player added ✓");
    } catch (e) { flash(e.message); }
  };

  const removePlayer = async (id) => {
    if (!window.confirm("Deactivate this player?")) return;
    try { await api.del(`/admin/players/${id}`, token); loadPlayers(); flash("Player removed"); } catch {}
  };

  const togglePayment = async (playerId, status) => {
    try {
      if (status === "paid") {
        await api.post("/admin/payments/mark-unpaid", { player_id: playerId, month: payMonth, year: payYear }, token);
      } else {
        await api.post("/admin/payments/mark-paid", { player_id: playerId, month: payMonth, year: payYear }, token);
      }
      loadPayments(); loadDashboard(); flash("Payment updated ✓");
    } catch (e) { flash(e.message); }
  };

  const addExpense = async () => {
    if (!expTitle || !expAmount || !expDate) return;
    try {
      await api.post("/admin/expenses", { title: expTitle, amount: parseFloat(expAmount), date: expDate, description: expDesc }, token);
      setExpTitle(""); setExpAmount(""); setExpDesc(""); setShowAddExpense(false);
      loadExpenses(); loadDashboard(); flash("Expense added ✓");
    } catch (e) { flash(e.message); }
  };

  const deleteExpense = async (id) => {
    try { await api.del(`/admin/expenses/${id}`, token); loadExpenses(); flash("Expense deleted"); } catch {}
  };

  const trendData = dashboard?.trend?.map(m => ({
    name: `${MONTHS[m.month - 1]}`,
    Income: Number(m.income),
  })) || [];

  return (
    <div>
      {msg && <div style={{ background: "rgba(34,197,94,0.12)", border: "0.5px solid rgba(34,197,94,0.3)", color: "#22c55e", borderRadius: 8, padding: "8px 14px", marginBottom: 14, fontSize: 13 }}>{msg}</div>}
      <div className="admin-wrap">
        <div className="sidebar">
          {TABS.map(t => (
            <div key={t.id} className={`sidebar-item ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              <span>{t.icon}</span> {t.label}
            </div>
          ))}
        </div>

        <div className="admin-main">

          {/* OVERVIEW */}
          {tab === "overview" && (
            <div>
              <div className="grid-4" style={{ marginBottom: 16 }}>
                <div className="card"><div className="card-label">Total Players</div><div className="card-value">{dashboard?.players.total_players || "—"}</div></div>
                <div className="card"><div className="card-label">Paid This Month</div><div className="card-value green">{dashboard?.players.paid_this_month || "—"}</div></div>
                <div className="card"><div className="card-label">Unpaid</div><div className="card-value red">{dashboard?.players.unpaid_this_month || "—"}</div></div>
                <div className="card"><div className="card-label">Balance</div><div className="card-value blue">{dashboard ? fmt(dashboard.finance.balance) : "—"}</div></div>
              </div>
              <div className="grid-2">
                <div className="card">
                  <div className="section-title">Finance summary</div>
                  <div className="expense-row"><div><div className="expense-title">Total Income</div></div><div style={{ color: "#22c55e", fontWeight: 500 }}>{dashboard ? fmt(dashboard.finance.total_income) : "—"}</div></div>
                  <div className="expense-row"><div><div className="expense-title">Total Expenses</div></div><div style={{ color: "#ef4444", fontWeight: 500 }}>{dashboard ? fmt(dashboard.finance.total_expenses) : "—"}</div></div>
                  <div className="expense-row"><div><div className="expense-title">This Month Income</div></div><div style={{ color: "#60a5fa", fontWeight: 500 }}>{dashboard ? fmt(dashboard.finance.month_income) : "—"}</div></div>
                </div>
                <div className="card">
                  <div className="section-title">Recent activity</div>
                  {dashboard?.recentActivity?.slice(0, 4).map((log, i) => (
                    <div key={i} className="expense-row">
                      <div><div className="expense-title" style={{ fontSize: 12 }}>{log.action.replace(/_/g, " ")}</div>
                      <div className="expense-date">{new Date(log.timestamp).toLocaleString()} · {log.username}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PLAYERS */}
          {tab === "players" && (
            <div>
              <button className="btn-outline" style={{ marginBottom: 14 }} onClick={() => setShowAddPlayer(!showAddPlayer)}>
                + Add player
              </button>
              {showAddPlayer && (
                <div className="add-form">
                  <div className="add-form-title">New player</div>
                  <div className="form-row">
                    <div><label className="input-label">Full name</label><input className="pp-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Emeka Okafor" /></div>
                    <div><label className="input-label">Jersey #</label><input className="pp-input" type="number" value={newJersey} onChange={e => setNewJersey(e.target.value)} placeholder="9" /></div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label className="input-label">Position</label>
                    <select className="pp-input" value={newPos} onChange={e => setNewPos(e.target.value)}>
                      {["Goalkeeper","Defender","Midfielder","Forward"].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <button className="btn-primary" onClick={addPlayer}>Add player</button>
                </div>
              )}
              <div className="grid-3">
                {players.map(p => (
                  <div key={p.id} className="player-card">
                    <div style={{ display: "flex", justifyContent: "center" }}><Avatar player={{ ...p, full_name: p.full_name }} size={48} /></div>
                    <div className="p-name">{p.full_name}</div>
                    <div className="p-pos">{p.position}</div>
                    <div className="p-jersey">#{p.jersey_number}</div>
                    <span className={`badge-${p.current_payment_status}`}>{p.current_payment_status}</span>
                    <div style={{ marginTop: 8 }}><button className="btn-sm danger" onClick={() => removePlayer(p.id)}>Remove</button></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAYMENTS */}
          {tab === "payments" && (
            <div>
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <select className="pp-input" style={{ width: 130 }} value={payMonth} onChange={e => setPayMonth(e.target.value)}>
                  {MONTHS_FULL.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
                <select className="pp-input" style={{ width: 90 }} value={payYear} onChange={e => setPayYear(e.target.value)}>
                  {[2025, 2024, 2023].map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
              <div className="card">
                <table className="pp-table">
                  <thead><tr><th>Player</th><th>Position</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.player_id}>
                        <td><div className="player-name-cell"><Avatar player={{ id: p.player_id, full_name: p.full_name }} size={28} />{p.full_name}</div></td>
                        <td style={{ color: "var(--text-muted)" }}>{p.position}</td>
                        <td><span className={`badge-${p.status}`}>{p.status}</span></td>
                        <td>
                          <button className={`btn-sm ${p.status === "paid" ? "danger" : ""}`} onClick={() => togglePayment(p.player_id, p.status)}>
                            {p.status === "paid" ? "Mark unpaid" : "Mark paid"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* EXPENSES */}
          {tab === "expenses" && (
            <div>
              <button className="btn-outline" style={{ marginBottom: 14 }} onClick={() => setShowAddExpense(!showAddExpense)}>
                + Add expense
              </button>
              {showAddExpense && (
                <div className="add-form">
                  <div className="add-form-title">New expense</div>
                  <div className="form-row">
                    <div><label className="input-label">Title</label><input className="pp-input" value={expTitle} onChange={e => setExpTitle(e.target.value)} placeholder="Pitch rental" /></div>
                    <div><label className="input-label">Amount (₦)</label><input className="pp-input" type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="15000" /></div>
                  </div>
                  <div className="form-row">
                    <div><label className="input-label">Date</label><input className="pp-input" type="date" value={expDate} onChange={e => setExpDate(e.target.value)} /></div>
                    <div><label className="input-label">Description</label><input className="pp-input" value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="Optional" /></div>
                  </div>
                  <button className="btn-primary" onClick={addExpense}>Add expense</button>
                </div>
              )}
              <div className="card">
                <table className="pp-table">
                  <thead><tr><th>Title</th><th>Date</th><th>Amount</th><th>Added by</th><th></th></tr></thead>
                  <tbody>
                    {expenses.map(e => (
                      <tr key={e.id}>
                        <td>{e.title}</td>
                        <td style={{ color: "var(--text-muted)" }}>{e.date?.slice(0,10)}</td>
                        <td style={{ color: "var(--red)", fontWeight: 500 }}>-{fmt(e.amount)}</td>
                        <td style={{ color: "var(--text-muted)" }}>{e.added_by}</td>
                        <td><button className="btn-sm danger" onClick={() => deleteExpense(e.id)}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ANALYTICS */}
          {tab === "analytics" && (
            <div>
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="section-title">Income trend (6 months)</div>
                <div className="chart-wrap" style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <XAxis dataKey="name" tick={{ fill: "#8892a4", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#8892a4", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => "₦" + (v/1000) + "k"} />
                      <Tooltip contentStyle={{ background: "#111827", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} formatter={v => fmt(v)} />
                      <Line type="monotone" dataKey="Income" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: "#22c55e" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="card">
                <div className="section-title">Payment consistency (last 3 months)</div>
                {dashboard?.topPayers?.map(p => {
                  const pct = p.total_count > 0 ? Math.round((p.paid_count / p.total_count) * 100) : 0;
                  return (
                    <div key={p.jersey_number} className="bar-wrap">
                      <div className="bar-label">{p.full_name.split(" ")[0]}</div>
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                      <div className="bar-val">{p.paid_count}/{p.total_count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
