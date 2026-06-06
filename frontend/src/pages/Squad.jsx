import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Avatar from "../components/Avatar";

export default function Squad() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/public/players")
      .then(d => setPlayers(d.players || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="section-title" style={{ marginBottom: 16 }}>Current Squad</div>
      {loading && <p style={{ color: "var(--text-muted)" }}>Loading...</p>}
      <div className="grid-3">
        {players.map(p => (
          <div key={p.id} className="player-card">
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Avatar player={p} size={52} />
            </div>
            <div className="p-name">{p.full_name}</div>
            <div className="p-pos">{p.position}</div>
            <div className="p-jersey">#{p.jersey_number}</div>
            <span className={`badge-${p.payment_status}`}>{p.payment_status}</span>
          </div>
        ))}
        {!loading && players.length === 0 && (
          <p style={{ color: "var(--text-muted)", gridColumn: "1/-1" }}>No players. Start the backend and run the seed.</p>
        )}
      </div>
    </div>
  );
}
