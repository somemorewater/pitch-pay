import { getInitials, avatarColor } from "../lib/api";

export default function Avatar({ player, size = 32 }) {
  const color = avatarColor(player.id);
  const fontSize = size < 40 ? 12 : 15;
  return (
    <div
      className="avatar"
      style={{
        width: size, height: size, fontSize,
        background: color + "22",
        color: color,
        border: `1px solid ${color}44`,
      }}
      aria-hidden="true"
    >
      {player.profile_photo
        ? <img src={player.profile_photo} alt={player.full_name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
        : getInitials(player.full_name || player.name || "?")}
    </div>
  );
}
