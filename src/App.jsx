import React, { useCallback, useEffect, useState } from "react";
import Login from "./Login";
import Admin from "./Admin";
import { getMe, hasCreds, clearCreds } from "./api";

export default function App() {
  const [state, setState] = useState(hasCreds() ? "checking" : "signed-out");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (state !== "checking") return;
    getMe()
      .then(() => setState("admin"))
      .catch((err) => {
        if (err.status === 429) {
          setMessage(err.message);
        } else if (err.status === 401) {
          clearCreds();
          setMessage("Admin key rejected. Enter it again.");
        } else {
          setMessage(err.message);
        }
        setState("signed-out");
      });
  }, [state]);

  const signOut = useCallback(() => {
    clearCreds();
    setMessage("");
    setState("signed-out");
  }, []);

  if (state === "checking") return <div className="center muted">Checking...</div>;
  if (state === "signed-out") return <Login notice={message} onSubmitted={() => setState("checking")} />;
  return <Admin onSignOut={signOut} />;
}
