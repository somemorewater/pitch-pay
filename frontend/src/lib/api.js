const BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || process.env.REACT_APP_API_URL || "/api";

export const api = {
  get: async (path, token = null) => {
    const res = await fetch(`${BASE}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error((await res.json()).error || "Request failed");
    return res.json();
  },
  post: async (path, body, token = null) => {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Request failed");
    return res.json();
  },
  put: async (path, body, token) => {
    const res = await fetch(`${BASE}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Request failed");
    return res.json();
  },
  del: async (path, token) => {
    const res = await fetch(`${BASE}${path}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error((await res.json()).error || "Request failed");
    return res.json();
  },
};

export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export const fmt = (n) => "₦" + Number(n).toLocaleString();

export const getInitials = (name) =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const COLORS = ["#3b82f6","#8b5cf6","#ec4899","#f97316","#14b8a6","#f59e0b","#ef4444","#22c55e"];
export const avatarColor = (id) => COLORS[id % COLORS.length];
