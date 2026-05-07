import React, { useEffect, useState } from "react";
import { api } from "../../context/AuthContext";
import { Warning, BellRinging, BatteryCharging, CheckCircle } from "@phosphor-icons/react";
import { toast } from "sonner";

const SEV = {
  info: { color: "text-forest", bg: "bg-forest/5", label: "Info" },
  warning: { color: "text-amber-700", bg: "bg-amber-50", label: "Attention" },
  critical: { color: "text-destructive", bg: "bg-destructive/10", label: "Critique" },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const r = await api.get("/alerts");
      setAlerts(r.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  const markRead = async (id) => {
    await api.patch(`/alerts/${id}/read`);
    refresh();
  };

  const markAll = async () => {
    await api.post("/alerts/mark-all-read");
    toast.success("Toutes les alertes marquées comme lues");
    refresh();
  };

  const unread = alerts.filter((a) => !a.read).length;

  return (
    <div className="space-y-10">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="label-eyebrow text-forest/50">Alertes</div>
          <h1 className="mt-3 font-heading font-light text-5xl tracking-tight">Centre d'alertes.</h1>
          <p className="mt-2 text-forest/70">{unread} non lue{unread > 1 ? "s" : ""}.</p>
        </div>
        {unread > 0 && (
          <button onClick={markAll} data-testid="mark-all-read" className="inline-flex items-center gap-2 bg-white border border-border px-5 py-3 rounded-full font-medium hover:border-forest/40 transition-colors">
            <CheckCircle size={16} weight="duotone" /> Tout marquer comme lu
          </button>
        )}
      </header>

      {loading ? (
        <div className="text-forest/60 text-sm tracking-[0.22em] uppercase animate-pulse">Chargement…</div>
      ) : alerts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center">
          <h3 className="font-heading text-2xl font-light">Tout est calme.</h3>
          <p className="mt-2 text-forest/60">Aucune alerte à signaler — c'est bon signe.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => {
            const s = SEV[a.severity] || SEV.info;
            const Icon = a.severity === "critical" ? Warning : a.type === "low_battery" ? BatteryCharging : BellRinging;
            return (
              <div key={a.alert_id} data-testid={`alert-${a.alert_id}`} className={`rounded-3xl bg-white border p-6 flex items-start gap-4 ${a.read ? "border-border opacity-70" : "border-border shadow-sm"}`}>
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${s.bg} ${s.color}`}>
                  <Icon size={22} weight="duotone" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-heading text-lg font-semibold">{a.title}</h3>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{s.label}</span>
                  </div>
                  <p className="mt-1 text-sm text-forest/70">{a.body}</p>
                  <div className="mt-2 text-xs font-mono text-forest/50">{new Date(a.created_at).toLocaleString("fr-FR")}</div>
                </div>
                {!a.read && (
                  <button onClick={() => markRead(a.alert_id)} data-testid={`mark-read-${a.alert_id}`} className="text-xs text-forest/70 hover:text-forest underline-offset-4 hover:underline">Marquer lu</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
