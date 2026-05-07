import React, { useEffect, useState } from "react";
import { Plus, Trash, Clock, Lock, BellRinging, Warning } from "@phosphor-icons/react";
import { api } from "../../context/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../../components/ui/dialog";
import { Switch } from "../../components/ui/switch";

const DAYS = ["L", "M", "M", "J", "V", "S", "D"];
const DAY_LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const dayBadge = (days) => {
  if (days.length === 7) return "Tous les jours";
  if (days.length === 5 && days.every(d => d < 5)) return "Semaine";
  if (days.length === 2 && days.includes(5) && days.includes(6)) return "Week-end";
  return days.map(d => DAYS[d]).join(" · ");
};

const RuleDialog = ({ safes, profiles, onCreated, existing }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(existing || {
    safe_id: "",
    profile_id: "",
    name: "",
    days: [0, 1, 2, 3, 4],
    start_time: "21:00",
    end_time: "07:00",
    require_lock: true,
    beep_if_absent: true,
    alert_parent: true,
    enabled: true,
  });
  const [busy, setBusy] = useState(false);

  const toggleDay = (d) => {
    setForm((f) => ({ ...f, days: f.days.includes(d) ? f.days.filter(x => x !== d) : [...f.days, d].sort() }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.safe_id) { toast.error("Sélectionnez un safe"); return; }
    if (form.days.length === 0) { toast.error("Choisissez au moins un jour"); return; }
    setBusy(true);
    try {
      const payload = { ...form, profile_id: form.profile_id || null };
      if (existing) await api.put(`/rules/${existing.rule_id}`, payload);
      else await api.post("/rules", payload);
      toast.success(existing ? "Règle mise à jour" : "Règle créée");
      setOpen(false);
      onCreated();
    } catch { toast.error("Erreur"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {existing ? (
          <button data-testid={`edit-rule-${existing.rule_id}`} className="text-sm text-forest/70 hover:text-forest underline-offset-4 hover:underline">Modifier</button>
        ) : (
          <button data-testid="create-rule-btn" className="inline-flex items-center gap-2 bg-terracotta text-white px-5 py-3 rounded-full font-medium hover:bg-terracotta-dark transition-colors">
            <Plus size={16} weight="bold" /> Créer une règle
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="font-heading text-2xl font-light">{existing ? "Modifier la règle" : "Nouvelle règle"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="label-eyebrow text-forest/60 block mb-2">Nom</label>
            <input data-testid="rule-name" required placeholder="Ex: École, Nuit, Devoirs" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-border focus:outline-none focus:border-forest" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-eyebrow text-forest/60 block mb-2">Safe</label>
              <select data-testid="rule-safe" value={form.safe_id} onChange={(e) => setForm({ ...form, safe_id: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-border focus:outline-none focus:border-forest bg-white">
                <option value="">— Choisir —</option>
                {safes.map((s) => <option key={s.safe_id} value={s.safe_id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label-eyebrow text-forest/60 block mb-2">Profil (optionnel)</label>
              <select data-testid="rule-profile" value={form.profile_id || ""} onChange={(e) => setForm({ ...form, profile_id: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-border focus:outline-none focus:border-forest bg-white">
                <option value="">Toute la famille</option>
                {profiles.map((p) => <option key={p.profile_id} value={p.profile_id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label-eyebrow text-forest/60 block mb-2">Jours</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((d, i) => (
                <button type="button" key={i} onClick={() => toggleDay(i)} data-testid={`day-${i}`} className={`w-11 h-11 rounded-2xl font-semibold transition-colors ${form.days.includes(i) ? "bg-forest text-white" : "bg-muted text-forest/60 hover:bg-forest/10"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-eyebrow text-forest/60 block mb-2">Début</label>
              <input data-testid="rule-start" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-border focus:outline-none focus:border-forest" />
            </div>
            <div>
              <label className="label-eyebrow text-forest/60 block mb-2">Fin</label>
              <input data-testid="rule-end" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-border focus:outline-none focus:border-forest" />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-muted/40">
              <span className="text-sm font-medium flex items-center gap-2"><Lock size={16} weight="duotone" /> Verrouillage obligatoire</span>
              <Switch checked={form.require_lock} onCheckedChange={(v) => setForm({ ...form, require_lock: v })} data-testid="rule-require-lock" />
            </label>
            <label className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-muted/40">
              <span className="text-sm font-medium flex items-center gap-2"><BellRinging size={16} weight="duotone" /> Bip si téléphone absent</span>
              <Switch checked={form.beep_if_absent} onCheckedChange={(v) => setForm({ ...form, beep_if_absent: v })} data-testid="rule-beep" />
            </label>
            <label className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-muted/40">
              <span className="text-sm font-medium flex items-center gap-2"><Warning size={16} weight="duotone" /> Alerter le parent si non respect</span>
              <Switch checked={form.alert_parent} onCheckedChange={(v) => setForm({ ...form, alert_parent: v })} data-testid="rule-alert-parent" />
            </label>
          </div>

          <DialogFooter><button data-testid="rule-submit" disabled={busy} className="bg-forest text-white px-5 py-2.5 rounded-full font-medium disabled:opacity-50">{busy ? "…" : "Enregistrer"}</button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function RulesPage() {
  const [rules, setRules] = useState([]);
  const [safes, setSafes] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const [r, s, p] = await Promise.all([
        api.get("/rules"),
        api.get("/safes"),
        api.get("/profiles"),
      ]);
      setRules(r.data); setSafes(s.data); setProfiles(p.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  const toggleEnabled = async (rule) => {
    try {
      await api.patch(`/rules/${rule.rule_id}/toggle`);
      refresh();
    } catch { toast.error("Erreur"); }
  };

  const remove = async (rule) => {
    if (!window.confirm(`Supprimer la règle « ${rule.name} » ?`)) return;
    try { await api.delete(`/rules/${rule.rule_id}`); toast.success("Supprimée"); refresh(); }
    catch { toast.error("Erreur"); }
  };

  return (
    <div className="space-y-10">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="label-eyebrow text-forest/50">Règles</div>
          <h1 className="mt-3 font-heading font-light text-5xl tracking-tight">Vos règles d'écran.</h1>
          <p className="mt-2 text-forest/70">Définissez quand le téléphone doit rester dans le safe.</p>
        </div>
        {safes.length > 0 ? <RuleDialog safes={safes} profiles={profiles} onCreated={refresh} /> : (
          <div className="text-sm text-forest/60">Ajoutez d'abord un safe depuis le tableau de bord.</div>
        )}
      </header>

      {loading ? (
        <div className="text-forest/60 text-sm tracking-[0.22em] uppercase animate-pulse">Chargement…</div>
      ) : rules.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center">
          <h3 className="font-heading text-2xl font-light">Aucune règle pour l'instant.</h3>
          <p className="mt-2 text-forest/60">Créez votre première règle pour automatiser le verrouillage.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {rules.map((rule) => {
            const safe = safes.find((s) => s.safe_id === rule.safe_id);
            const profile = profiles.find((p) => p.profile_id === rule.profile_id);
            return (
              <div key={rule.rule_id} className={`rounded-3xl border bg-white p-6 transition-all ${rule.enabled ? "border-border" : "border-border opacity-60"}`} data-testid={`rule-card-${rule.rule_id}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="label-eyebrow text-forest/50">{safe?.name || "—"}{profile ? ` · ${profile.name}` : ""}</div>
                    <h3 className="font-heading text-2xl font-semibold mt-1">{rule.name}</h3>
                  </div>
                  <Switch checked={rule.enabled} onCheckedChange={() => toggleEnabled(rule)} data-testid={`toggle-rule-${rule.rule_id}`} />
                </div>
                <div className="mt-5 flex items-center gap-4 text-forest/80">
                  <div className="flex items-center gap-2"><Clock size={18} weight="duotone" /><span className="font-mono text-base font-semibold">{rule.start_time} → {rule.end_time}</span></div>
                </div>
                <div className="mt-2 text-sm text-forest/60">{dayBadge(rule.days)}</div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {rule.require_lock && <span className="px-2.5 py-1 rounded-full bg-forest/5">Verrou obligatoire</span>}
                  {rule.beep_if_absent && <span className="px-2.5 py-1 rounded-full bg-forest/5">Bip absence</span>}
                  {rule.alert_parent && <span className="px-2.5 py-1 rounded-full bg-terracotta/10 text-terracotta">Alerte parent</span>}
                </div>
                <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                  <RuleDialog safes={safes} profiles={profiles} onCreated={refresh} existing={rule} />
                  <button onClick={() => remove(rule)} data-testid={`delete-rule-${rule.rule_id}`} className="text-sm text-destructive hover:underline inline-flex items-center gap-1.5"><Trash size={14} weight="duotone" /> Supprimer</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
