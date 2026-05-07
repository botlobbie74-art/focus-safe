import React, { useEffect, useState } from "react";
import { api } from "../../context/AuthContext";
import { Lock, LockOpen, Phone, Warning, BatteryCharging, BellRinging, Clock } from "@phosphor-icons/react";

const TYPE_META = {
  placed: { icon: <Phone size={16} weight="duotone" />, color: "text-emerald-700", bg: "bg-emerald-50", label: "Placé" },
  removed: { icon: <Phone size={16} weight="duotone" />, color: "text-amber-700", bg: "bg-amber-50", label: "Retiré" },
  locked: { icon: <Lock size={16} weight="duotone" />, color: "text-forest", bg: "bg-forest/5", label: "Verrouillé" },
  unlocked: { icon: <LockOpen size={16} weight="duotone" />, color: "text-forest", bg: "bg-forest/5", label: "Déverrouillé" },
  open_attempt: { icon: <Warning size={16} weight="duotone" />, color: "text-destructive", bg: "bg-destructive/10", label: "Tentative" },
  door_opened: { icon: <LockOpen size={16} weight="duotone" />, color: "text-forest", bg: "bg-forest/5", label: "Porte ouverte" },
  door_closed: { icon: <Lock size={16} weight="duotone" />, color: "text-forest", bg: "bg-forest/5", label: "Porte fermée" },
  low_battery: { icon: <BatteryCharging size={16} weight="duotone" />, color: "text-amber-700", bg: "bg-amber-50", label: "Batterie faible" },
  phone_absent: { icon: <BellRinging size={16} weight="duotone" />, color: "text-destructive", bg: "bg-destructive/10", label: "Téléphone absent" },
  rule_started: { icon: <Clock size={16} weight="duotone" />, color: "text-forest", bg: "bg-forest/5", label: "Règle démarrée" },
  rule_ended: { icon: <Clock size={16} weight="duotone" />, color: "text-forest", bg: "bg-forest/5", label: "Règle terminée" },
  manual_unlock: { icon: <LockOpen size={16} weight="duotone" />, color: "text-forest", bg: "bg-forest/5", label: "Déverr. manuel" },
};

export default function HistoryPage() {
  const [safes, setSafes] = useState([]);
  const [selected, setSelected] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get("/safes");
        setSafes(r.data);
        if (r.data.length) setSelected(r.data[0].safe_id);
      } finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (!selected) return;
    (async () => {
      try {
        const r = await api.get(`/safes/${selected}/events?limit=200`);
        setEvents(r.data);
      } catch {}
    })();
  }, [selected]);

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-10">
      <header>
        <div className="label-eyebrow text-forest/50">Historique</div>
        <h1 className="mt-3 font-heading font-light text-5xl tracking-tight">Tout ce qui s'est passé.</h1>
        <p className="mt-2 text-forest/70">La preuve d'usage, sans surveiller personne.</p>
      </header>

      {loading ? (
        <div className="text-forest/60 text-sm tracking-[0.22em] uppercase animate-pulse">Chargement…</div>
      ) : safes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center">
          <h3 className="font-heading text-2xl font-light">Aucun safe pour l'instant.</h3>
          <p className="mt-2 text-forest/60">Ajoutez un safe pour voir ses événements ici.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {safes.map((s) => (
              <button key={s.safe_id} onClick={() => setSelected(s.safe_id)} data-testid={`history-tab-${s.safe_id}`} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selected === s.safe_id ? "bg-forest text-white" : "bg-white border border-border hover:border-forest/40"}`}>
                {s.name}
              </button>
            ))}
          </div>

          {events.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center">
              <h3 className="font-heading text-2xl font-light">Aucun événement encore.</h3>
              <p className="mt-2 text-forest/60">Les actions du safe apparaîtront ici en temps réel.</p>
            </div>
          ) : (
            <ol className="relative border-l-2 border-border pl-8 ml-4 space-y-6">
              {events.map((e) => {
                const m = TYPE_META[e.type] || TYPE_META.placed;
                return (
                  <li key={e.event_id} className="relative" data-testid={`event-${e.event_id}`}>
                    <span className={`absolute -left-[42px] top-1 w-7 h-7 rounded-full ${m.bg} ${m.color} flex items-center justify-center border-2 border-sand`}>
                      {m.icon}
                    </span>
                    <div className="flex items-baseline justify-between gap-4 flex-wrap">
                      <div className="font-heading text-lg font-semibold">{m.label}</div>
                      <span className="text-xs font-mono text-forest/50">{formatTime(e.created_at)}</span>
                    </div>
                    <p className="text-sm text-forest/70 mt-1">{e.message}</p>
                  </li>
                );
              })}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
