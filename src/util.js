// Pure helpers for the admin page (unit tested).

export function orgStatus(org) {
  if (org.suspended_at) return "suspended";
  if (!org.last_event_at) return "no-events";
  const ageMs = Date.now() - new Date(org.last_event_at).getTime();
  if (ageMs <= 24 * 60 * 60 * 1000) return "active";
  if (ageMs <= 7 * 24 * 60 * 60 * 1000) return "quiet";
  return "stale";
}

export function timeAgo(value, now = Date.now()) {
  if (!value) return "never";
  const diff = Math.max(0, now - new Date(value).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export function apiBase() {
  const url = (import.meta.env.VITE_API_URL || "https://api.lastgood.space").replace(/\/$/, "");
  const prefix = import.meta.env.VITE_API_PREFIX || "/api";
  return url + prefix;
}
