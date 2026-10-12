import React, { useState } from "react";
import { setCreds } from "./api";

export default function Login({ onSubmitted, notice }) {
  const [user, setUser] = useState("");
  const [key, setKey] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!key.trim()) return;
    setCreds(user.trim(), key.trim());
    onSubmitted();
  };

  return (
    <div className="center">
      <div className="card login">
        <h1>LastGood Admin</h1>
        {notice && <p className="err">{notice}</p>}
        <form onSubmit={submit}>
          <label>Admin ID</label>
          <input value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" />
          <label>Admin key</label>
          <input type="password" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="current-password" required />
          <button className="primary">Continue</button>
        </form>
        <p className="muted small">Stored in this browser only. Sent as X-Admin-User / X-Admin-Key headers.</p>
      </div>
    </div>
  );
}
