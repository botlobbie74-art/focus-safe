import React, { useEffect, useState } from "react";
import { api, useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { Switch } from "../../components/ui/switch";
import { ShieldCheck, Sun, Coffee, BellRinging, EnvelopeSimple, Key } from "@phosphor-icons/react";

const Row = ({ icon, title, body, children, testId }) => (
  <div className="flex items-center justify-between gap-4 py-5 border-b border-border last:border-0" data-testid={testId}>
    <div className="flex items-start gap-4">
      <div className="p-2.5 rounded-xl bg-forest/5 text-forest mt-0.5">{icon}</div>
      <div>
        <div className="font-heading font-semibold text-forest">{title}</div>
        <div className="text-sm text-forest/60">{body}</div>
      </div>
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

export default function SettingsPage() {
  const { user } = useAuth();
  const [s, setS] = useState(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const r = await api.get("/settings");
    setS(r.data);
    setCode(r.data.master_code || "");
  };

  useEffect(() => { refresh(); }, []);

  const update = async (patch) => {
    try {
      const r = await api.put("/settings", patch);
      setS(r.data);
      toast.success("Paramètres mis à jour");
    } catch { toast.error("Erreur"); }
  };

  const saveCode = async (e) => {
    e.preventDefault();
    if (code.length < 4) { toast.error("Code : 4 chiffres minimum"); return; }
    setBusy(true);
    await update({ master_code: code });
    setBusy(false);
  };

  if (!s) return <div className="text-forest/60 text-sm tracking-[0.22em] uppercase animate-pulse">Chargement…</div>;

  return (
    <div className="space-y-10">
      <header>
        <div className="label-eyebrow text-forest/50">Paramètres</div>
        <h1 className="mt-3 font-heading font-light text-5xl tracking-tight">Préférences.</h1>
      </header>

      <section className="rounded-3xl bg-white border border-border p-8">
        <h2 className="font-heading text-2xl font-semibold mb-2">Famille</h2>
        <p className="text-sm text-forest/60 mb-6">Partagez ce code avec votre conjoint·e pour qu'il rejoigne la famille.</p>
        <div className="flex items-center gap-4">
          <div className="font-mono text-2xl font-bold tracking-wider px-5 py-3 rounded-2xl bg-forest text-white" data-testid="settings-family-code">{user?.family_code}</div>
          <button onClick={() => { navigator.clipboard.writeText(user?.family_code || ""); toast.success("Code copié"); }} data-testid="copy-family-code" className="text-sm text-forest/70 hover:text-forest underline-offset-4 hover:underline">Copier</button>
        </div>
      </section>

      <section className="rounded-3xl bg-white border border-border p-8">
        <h2 className="font-heading text-2xl font-semibold mb-2">Code maître</h2>
        <p className="text-sm text-forest/60 mb-6">Permet aux parents de déverrouiller manuellement un safe pendant qu'une règle est active.</p>
        <form onSubmit={saveCode} className="flex items-center gap-3">
          <Key size={20} weight="duotone" className="text-forest" />
          <input data-testid="master-code" type="password" inputMode="numeric" pattern="\d{4,8}" value={code} onChange={(e) => setCode(e.target.value)} placeholder="••••" className="px-5 py-3 rounded-2xl border border-border font-mono text-lg tracking-widest focus:outline-none focus:border-forest" />
          <button data-testid="save-master-code" disabled={busy} className="bg-forest text-white px-5 py-3 rounded-full font-medium disabled:opacity-50">{busy ? "…" : "Enregistrer"}</button>
        </form>
      </section>

      <section className="rounded-3xl bg-white border border-border p-8">
        <h2 className="font-heading text-2xl font-semibold mb-2">Modes</h2>
        <Row icon={<Sun size={18} weight="duotone" />} title="Mode vacances" body="Suspend toutes les règles." testId="row-vacation">
          <Switch checked={s.vacation_mode} onCheckedChange={(v) => update({ vacation_mode: v })} data-testid="toggle-vacation" />
        </Row>
        <Row icon={<Coffee size={18} weight="duotone" />} title="Mode week-end" body="Assouplit les règles le samedi et le dimanche." testId="row-weekend">
          <Switch checked={s.weekend_mode} onCheckedChange={(v) => update({ weekend_mode: v })} data-testid="toggle-weekend" />
        </Row>
      </section>

      <section className="rounded-3xl bg-white border border-border p-8">
        <h2 className="font-heading text-2xl font-semibold mb-2">Notifications</h2>
        <Row icon={<EnvelopeSimple size={18} weight="duotone" />} title="Alertes email" body="Recevez les alertes critiques par email." testId="row-email">
          <Switch checked={s.email_alerts} onCheckedChange={(v) => update({ email_alerts: v })} data-testid="toggle-email" />
        </Row>
        <Row icon={<BellRinging size={18} weight="duotone" />} title="Notifications push" body="Recevez les alertes en direct sur votre navigateur." testId="row-push">
          <Switch checked={s.push_alerts} onCheckedChange={(v) => update({ push_alerts: v })} data-testid="toggle-push" />
        </Row>
      </section>

      <section className="rounded-3xl bg-forest text-white p-8">
        <div className="flex items-center gap-3"><ShieldCheck size={22} weight="duotone" /><h2 className="font-heading text-2xl font-semibold">Confidentialité</h2></div>
        <p className="mt-3 text-white/80 text-sm leading-relaxed max-w-2xl">Focus Safe ne lit jamais le contenu du téléphone. Aucune SMS, aucune position, aucune historique de navigation. Le seul rôle du système est de savoir si le téléphone est physiquement présent dans le safe — et rien d'autre.</p>
      </section>
    </div>
  );
}
