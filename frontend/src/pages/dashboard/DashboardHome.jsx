import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, LockOpen, Phone, BatteryCharging, Plus, ShieldCheck, Sparkle, Clock, Users, BellRinging, ArrowUpRight, Target } from "@phosphor-icons/react";
import { api, useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../../components/ui/dialog";
import { Switch } from "../../components/ui/switch";

const StatusPill = ({ ok, label }) => (
  <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-emerald-500" : "bg-amber-500"}`} />
    {label}
  </span>
);

const SafeCard = ({ safe, onUpdate }) => {
  const updateStatus = async (patch) => {
    try {
      await api.post(`/safes/${safe.safe_id}/status`, patch);
      toast.success("Statut mis à jour");
      onUpdate();
    } catch { toast.error("Erreur lors de la mise à jour"); }
  };

  return (
    <div className="rounded-3xl bg-white border border-border p-8 hover:shadow-xl hover:-translate-y-0.5 transition-all" data-testid={`safe-card-${safe.safe_id}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="label-eyebrow text-forest/50 mb-2">Safe</div>
          <h3 className="font-heading text-3xl font-light tracking-tight">{safe.name}</h3>
          {safe.serial && <div className="text-xs text-forest/50 mt-1 font-mono">{safe.serial}</div>}
        </div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${safe.locked ? "bg-forest text-white" : "bg-forest/5 text-forest"}`}>
          {safe.locked ? <Lock size={26} weight="duotone" /> : <LockOpen size={26} weight="duotone" />}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-muted/40 p-4">
          <div className="label-eyebrow text-forest/50 mb-2">Téléphone</div>
          <div className="flex items-center gap-2">
            <Phone size={18} weight="duotone" className={safe.phone_present ? "text-emerald-700" : "text-forest/40"} />
            <StatusPill ok={safe.phone_present} label={safe.phone_present ? "Présent" : "Absent"} />
          </div>
        </div>
        <div className="rounded-2xl bg-muted/40 p-4">
          <div className="label-eyebrow text-forest/50 mb-2">Batterie</div>
          <div className="flex items-center gap-2">
            <BatteryCharging size={18} weight="duotone" className={safe.battery > 20 ? "text-emerald-700" : "text-amber-600"} />
            <span className="font-heading text-lg font-semibold" data-testid="safe-battery">{safe.battery}%</span>
            {safe.charging && <span className="text-[10px] uppercase tracking-wider text-emerald-700">en charge</span>}
          </div>
        </div>
        <div className="rounded-2xl bg-muted/40 p-4">
          <div className="label-eyebrow text-forest/50 mb-2">Verrou</div>
          <StatusPill ok={safe.locked} label={safe.locked ? "Verrouillé" : "Ouvert"} />
        </div>
        <div className="rounded-2xl bg-muted/40 p-4">
          <div className="label-eyebrow text-forest/50 mb-2">Porte</div>
          <StatusPill ok={!safe.door_open} label={safe.door_open ? "Ouverte" : "Fermée"} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button onClick={() => updateStatus({ locked: !safe.locked })} data-testid="toggle-lock-btn" className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 bg-forest text-white px-4 py-2.5 rounded-full text-sm font-medium hover:bg-forest-900 transition-colors">
          {safe.locked ? <LockOpen size={16} weight="bold" /> : <Lock size={16} weight="bold" />}
          {safe.locked ? "Déverrouiller" : "Verrouiller"}
        </button>
        <Link to="/dashboard/rules" className="inline-flex items-center justify-center gap-2 bg-white border border-border px-4 py-2.5 rounded-full text-sm font-medium hover:border-forest/40 transition-colors">
          <Plus size={14} weight="bold" /> Règle
        </Link>
      </div>

      <div className="mt-6 text-xs text-forest/50">
        Dernière activité : {safe.last_seen ? new Date(safe.last_seen).toLocaleString("fr-FR") : "—"}
      </div>
    </div>
  );
};

const CreateSafeDialog = ({ onCreated }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", serial: "", wifi_ssid: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/safes", form);
      toast.success("Safe ajouté");
      setOpen(false);
      setForm({ name: "", serial: "", wifi_ssid: "" });
      onCreated();
    } catch { toast.error("Erreur"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button data-testid="add-safe-btn" className="inline-flex items-center gap-2 bg-terracotta text-white px-5 py-3 rounded-full font-medium hover:bg-terracotta-dark transition-colors">
          <Plus size={16} weight="bold" /> Ajouter un safe
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-heading text-2xl font-light">Ajouter un safe</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3 pt-2">
          <input data-testid="safe-name-input" required placeholder="Nom (ex: Salon, Chambre Léa)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-border focus:outline-none focus:border-forest" />
          <input placeholder="Numéro de série (optionnel)" value={form.serial} onChange={(e) => setForm({ ...form, serial: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-border focus:outline-none focus:border-forest" />
          <input placeholder="Wi-Fi SSID (optionnel)" value={form.wifi_ssid} onChange={(e) => setForm({ ...form, wifi_ssid: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-border focus:outline-none focus:border-forest" />
          <DialogFooter><button data-testid="safe-submit" disabled={busy} className="bg-forest text-white px-5 py-2.5 rounded-full font-medium disabled:opacity-50">{busy ? "…" : "Ajouter"}</button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const StatTile = ({ icon, value, label, accent, testId }) => (
  <div className="rounded-3xl bg-white border border-border p-6" data-testid={testId}>
    <div className="flex items-center justify-between mb-4">
      <div className={`p-2.5 rounded-xl ${accent ? "bg-terracotta/10 text-terracotta" : "bg-forest/5 text-forest"}`}>{icon}</div>
    </div>
    <div className="font-heading text-4xl font-light text-forest">{value}</div>
    <div className="text-sm text-forest/60 mt-1">{label}</div>
  </div>
);

export default function DashboardHome() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const res = await api.get("/dashboard/summary");
      setSummary(res.data);
    } catch (e) { /* */ }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  if (loading) {
    return <div className="text-forest/60 text-sm tracking-[0.22em] uppercase animate-pulse">Chargement…</div>;
  }

  return (
    <div className="space-y-10">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="label-eyebrow text-forest/50">Tableau de bord</div>
          <h1 className="mt-3 font-heading font-light text-5xl tracking-tight">Bonjour, {user?.name?.split(" ")[0] || "👋"}.</h1>
          <p className="mt-2 text-forest/70">Voici l'état de votre maison.</p>
        </div>
        <CreateSafeDialog onCreated={refresh} />
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile testId="stat-safes" icon={<ShieldCheck size={20} weight="duotone" />} value={summary?.safes?.length ?? 0} label="Safes" />
        <StatTile testId="stat-rules" icon={<Target size={20} weight="duotone" />} value={summary?.rules_active ?? 0} label="Règles actives" />
        <StatTile testId="stat-profiles" icon={<Users size={20} weight="duotone" />} value={summary?.profiles_count ?? 0} label="Profils" />
        <StatTile testId="stat-alerts" icon={<BellRinging size={20} weight="duotone" />} value={summary?.alerts_unread ?? 0} label="Alertes non lues" accent />
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-semibold">Vos safes</h2>
          {summary?.safes?.length > 0 && (
            <Link to="/dashboard/history" className="text-sm text-forest/70 hover:text-forest inline-flex items-center gap-1">
              Voir l'historique <ArrowUpRight size={14} weight="bold" />
            </Link>
          )}
        </div>

        {summary?.safes?.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-forest/5 flex items-center justify-center mx-auto mb-4">
              <Sparkle size={24} weight="duotone" className="text-terracotta" />
            </div>
            <h3 className="font-heading text-2xl font-light">Ajoutez votre premier safe</h3>
            <p className="mt-2 text-forest/60 max-w-md mx-auto">Une fois branché à votre Wi-Fi, le safe se synchronisera automatiquement avec ce tableau de bord.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {summary.safes.map((s) => <SafeCard key={s.safe_id} safe={s} onUpdate={refresh} />)}
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-forest text-white p-10 lg:p-14 relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-72 h-72 rounded-full bg-terracotta/30 blur-3xl pointer-events-none" />
        <div className="grid lg:grid-cols-12 gap-8 items-end relative">
          <div className="lg:col-span-8">
            <div className="label-eyebrow text-white/50">Mode focus</div>
            <h3 className="mt-4 font-heading font-light text-4xl tracking-tight max-w-md">Activez un focus immédiat de 1 à 4 heures.</h3>
            <p className="mt-3 text-white/70 max-w-lg">Le safe se verrouille jusqu'à la fin de la session. Idéal pour les devoirs ou les repas en famille.</p>
          </div>
          <Link to="/dashboard/rules" data-testid="focus-now-cta" className="lg:col-span-4 inline-flex items-center justify-center gap-2 bg-terracotta hover:bg-terracotta-dark px-6 py-3.5 rounded-full font-medium transition-colors">
            Créer un focus <ArrowUpRight size={16} weight="bold" />
          </Link>
        </div>
      </section>
    </div>
  );
}
