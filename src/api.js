import { apiBase } from "./util";

const KEY = "lg_admin_key";
const USER = "lg_admin_user";

export const getCreds = () => ({
  key: localStorage.getItem(KEY) || "",
  user: localStorage.getItem(USER) || "",
});
export const hasCreds = () => !!localStorage.getItem(KEY);
export const setCreds = (user, key) => {
  localStorage.setItem(USER, user);
  localStorage.setItem(KEY, key);
};
export const clearCreds = () => {
  localStorage.removeItem(KEY);
  localStorage.removeItem(USER);
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const { key, user } = getCreds();
  const res = await fetch(apiBase() + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": key,
      "X-Admin-User": user,
    },
    body: method === "GET" ? undefined : JSON.stringify(body || {}),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) {
    throw new ApiError((json && json.message) || `Request failed (${res.status})`, res.status);
  }
  return json ? json.data : null;
}

export const getMe = () => request("/admin/me");
export const getOrgs = () => request("/admin/orgs");
export const revokeKeys = (id) => request(`/admin/orgs/${id}/revoke-keys`, { method: "POST" });
export const suspendOrg = (id, reason) => request(`/admin/orgs/${id}/suspend`, { method: "POST", body: { reason } });
export const unsuspendOrg = (id) => request(`/admin/orgs/${id}/unsuspend`, { method: "POST" });
export const deleteOrg = (id, confirmName) =>
  request(`/admin/orgs/${id}`, { method: "DELETE", body: { confirm_name: confirmName } });
