import { useEffect, useState, useRef } from "react";
import { api, fmt, MONTHS } from "../lib/api";
import Avatar from "../components/Avatar";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

export default function PublicDashboard() {
  const [finance, setFinance] = useState(null);
  const [summary, setSummary] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/public/finance"),
      api.get("/public/payments-summary"),
      api.get("/public/players"),
    ]).then(([fin, sum, pl]) => {
      setFinance(fin);
      setSummary(sum);
      setPlayers(pl.players || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const monthName = MONTHS[now.getMonth()];

  const chartData = finance?.monthly?.slice().reverse().map((m, i) => {
    const expRow = finance?.monthlyExpenses?.find(
      e => parseInt(e.month) === m.month && parseInt(e.year) === m.year
    );
    return {
      name: `${MONTHS[m.month - 1]} ${m.year}`,
      Income: Number(m.income),
      Expenses: Number(expRow?.total || 0),
    };
  }) || [];

  return (
    <div>
      <div className="grid-4">
        <div className="card">
          <div className="card-label">Total Balance</div>
          <div className="card-value green">{finance ? fmt(finance.summary.balance) : "—"}</div>
          <div className="card-sub">All time</div>
        </div>
        <div className="card">
          <div className="card-label">This Month Income</div>
          <div className="card-value">{summary ? fmt(summary.month_income) : "—"}</div>
          <div className="card-sub">{summary ? `${summary.paid_count} of ${summary.total_players} paid` : ""}</div>
        </div>
        <div className="card">
          <div className="card-label">Total Expenses</div>
          <div className="card-value red">{finance ? fmt(finance.summary.expenses) : "—"}</div>
          <div className="card-sub">All time</div>
        </div>
        <div className="card">
          <div className="card-label">Payment Rate</div>
          <div className="card-value blue">{summary ? `${summary.payment_rate}%` : "—"}</div>
          <div className="card-sub">This month</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-title">Income vs Expenses (6 months)</div>
          <div className="chart-wrap" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={14}>
                <XAxis dataKey="name" tick={{ fill: "#8892a4", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#8892a4", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => "₦" + (v/1000) + "k"} />
                <Tooltip contentStyle={{ background: "#111827", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} formatter={(v) => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#8892a4" }} />
                <Bar dataKey="Income" fill="#22c55e" radius={[3,3,0,0]} />
                <Bar dataKey="Expenses" fill="#ef4444" radius={[3,3,0,0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="section-title">Expense Ledger</div>
          {loading ? <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading...</p> : null}
          {/* Expenses are shown via public finance endpoint */}
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Connect to backend to view live expenses feed.</p>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Payment Status — {monthName} {now.getFullYear()}</div>
        <table className="pp-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Position</th>
              <th>Jersey</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {players.map(p => (
              <tr key={p.id}>
                <td>
                  <div className="player-name-cell">
                    <Avatar player={p} size={28} />
                    {p.full_name}
                  </div>
                </td>
                <td style={{ color: "var(--text-muted)" }}>{p.position}</td>
                <td style={{ color: "var(--text-muted)" }}>#{p.jersey_number}</td>
                <td><span className={`badge-${p.payment_status}`}>{p.payment_status}</span></td>
              </tr>
            ))}
            {!loading && players.length === 0 && (
              <tr><td colSpan={4} style={{ color: "var(--text-muted)", textAlign: "center", padding: 24 }}>No players found. Start the backend and seed data.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
