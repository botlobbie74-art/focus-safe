import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api, useAuth } from "../context/AuthContext";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash || "";
    const match = hash.match(/session_id=([^&]+)/);
    if (!match) {
      navigate("/login");
      return;
    }
    const session_id = match[1];

    (async () => {
      try {
        const res = await api.post("/auth/google/session", { session_id });
        setUser(res.data.user);
        // Clean fragment & redirect
        window.history.replaceState(null, "", window.location.pathname);
        navigate("/dashboard", { state: { user: res.data.user } });
      } catch {
        navigate("/login?error=oauth");
      }
    })();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand">
      <div className="text-forest text-sm tracking-[0.22em] uppercase animate-pulse">Connexion en cours…</div>
    </div>
  );
}
