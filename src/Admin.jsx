import React, { useCallback, useEffect, useState } from "react";
import { getOrgs, revokeKeys, suspendOrg, unsuspendOrg } from "./api";
import { orgStatus, timeAgo } from "./util";

const STATUS_LABEL = {
  suspended: "Suspended",
  active: "Active",
  quiet: "Quiet",
  stale: "Stale",
  "no-events": "No events",
};

function Confirm({ action, onCancel, onConfirm, busy }) {
  const [reason, setReason] = useState("");
  const { type, org } = action;
  const copy = {
    revoke: `Revoke all active API keys for ${org.name}? Their integrations stop sending events until they create new keys.`,
    suspend: `Suspend ${org.name}? Ingestion and console access are blocked for the whole org. API keys are kept; unsuspend restores everything.`,
    unsuspend: `Unsuspend ${org.name}?`,
  }[type];
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="card modal" onClick={(e) => e.stopPropagation()}>
        <p>{copy}</p>
        {type === "suspend" && (
          <input placeholder="Reason (optional, internal)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
        )}
        <div className="row end">
          <button onClick={onCancel} disabled={busy}>Cancel</button>
          <button className={type === "unsuspend" ? "primary" : "danger"} onClick={() => onConfirm(reason)} disabled={busy}>
            {busy ? "Working..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Admin({ onSignOut }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);
  const [action, setAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await getOrgs());
    } catch (err) {
      if (err.status === 401 || err.status === 403) return onSignOut();
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [onSignOut]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (reason) => {
    setBusy(true);
    try {
      const { type, org } = action;
      if (type === "revoke") {
        const r = await revokeKeys(org.id);
        setFlash(`Revoked ${r.revoked} key(s) for ${org.name}.`);
      } else if (type === "suspend") {
        await suspendOrg(org.id, reason);
        setFlash(`${org.name} suspended.`);
      } else {
        await unsuspendOrg(org.id);
        setFlash(`${org.name} unsuspended.`);
      }
      setAction(null);
      await load();
    } catch (err) {
      setFlash(err.message);
      setAction(null);
    } finally {
      setBusy(false);
    }
  };

  const totals = data ? data.totals : null;

  return (
    <div className="page">
      <header className="row between">
        <h1>LastGood Admin</h1>
        <div className="row">
          <button onClick={load} disabled={loading}>{loading ? "Refreshing..." : "Refresh"}</button>
          <button onClick={onSignOut}>Sign out</button>
        </div>
      </header>

      {flash && <p className="flash" onClick={() => setFlash("")}>{flash}</p>}
      {error && <p className="err">{error}</p>}

      {totals && (
        <div className="stats">
          <div className="card"><span>{totals.orgs}</span>orgs</div>
          <div className="card"><span>{totals.users}</span>users</div>
          <div className="card"><span>{totals.projects}</span>projects</div>
          <div className="card"><span>{totals.events_24h}</span>events / 24h</div>
        </div>
      )}

      {data && (
        <div className="card tablewrap">
          <table>
            <thead>
              <tr>
                <th>Org</th><th>Users</th><th>Projects</th><th>Keys</th>
                <th>24h</th><th>7d</th><th>Total</th><th>Last event</th><th></th>
              </tr>
            </thead>
            <tbody>
              {data.orgs.map((o) => {
                const status = orgStatus(o);
                return (
                  <React.Fragment key={o.id}>
                    <tr className="clickable" onClick={() => setOpen(open === o.id ? null : o.id)}>
                      <td>
                        <strong>{o.name}</strong>{" "}
                        <span className={`badge ${status}`}>{STATUS_LABEL[status]}</span>{" "}
                        <span className="muted small">{o.plan}</span>
                      </td>
                      <td>{o.user_count}</td>
                      <td>{o.project_count}</td>
                      <td>{o.active_api_keys}</td>
                      <td>{o.events_24h || 0}</td>
                      <td>{o.events_7d || 0}</td>
                      <td>{o.events_total || 0}</td>
                      <td>{timeAgo(o.last_event_at)}</td>
                      <td className="actions" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setAction({ type: "revoke", org: o })} disabled={o.active_api_keys === 0}>Revoke keys</button>
                        {o.suspended_at ? (
                          <button onClick={() => setAction({ type: "unsuspend", org: o })}>Unsuspend</button>
                        ) : (
                          <button className="danger" onClick={() => setAction({ type: "suspend", org: o })}>Suspend</button>
                        )}
                      </td>
                    </tr>
                    {open === o.id && (
                      <tr className="detail">
                        <td colSpan={9}>
                          <div className="muted small">
                            Created {timeAgo(o.created_at)} · {o.integration_count} active integration(s)
                            {o.suspended_at && ` · suspended ${timeAgo(o.suspended_at)}${o.suspended_reason ? `: ${o.suspended_reason}` : ""}`}
                          </div>
                          <ul>
                            {o.users.map((u) => (
                              <li key={u.id}>{u.email} <span className="muted small">{u.role || "member"}{u.is_verified ? "" : " · unverified"}</span></li>
                            ))}
                            {o.users.length === 0 && <li className="muted">No users</li>}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {data.orgs.length === 0 && (
                <tr><td colSpan={9} className="muted">No organizations yet.</td></tr>
              )}
            </tbody>
          </table>
          {data.users_without_org > 0 && (
            <p className="muted small pad">{data.users_without_org} user(s) not in any org yet (signed up, no org).</p>
          )}
        </div>
      )}

      {action && <Confirm action={action} busy={busy} onCancel={() => setAction(null)} onConfirm={run} />}
    </div>
  );
}
