import React, { useEffect, useState } from "react";
import { api } from "../../context/AuthContext";
import { toast } from "sonner";
import { Plus, Trash, User, Heart } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../../components/ui/dialog";

const COLORS = ["#1A3636", "#E07A5F", "#2D6A4F", "#6B7270", "#F4A261", "#7A5C40"];

const ProfileDialog = ({ safes, onCreated }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", role: "child", avatar_color: COLORS[0], safe_id: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/profiles", { ...form, safe_id: form.safe_id || null });
      toast.success("Profil créé");
      setOpen(false);
      setForm({ name: "", role: "child", avatar_color: COLORS[0], safe_id: "" });
      onCreated();
    } catch { toast.error("Erreur"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button data-testid="add-profile-btn" className="inline-flex items-center gap-2 bg-terracotta text-white px-5 py-3 rounded-full font-medium hover:bg-terracotta-dark transition-colors">
          <Plus size={16} weight="bold" /> Ajouter un profil
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-heading text-2xl font-light">Nouveau profil</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3 pt-2">
          <input data-testid="profile-name" required placeholder="Prénom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-border focus:outline-none focus:border-forest" />
          <div className="grid grid-cols-2 gap-2">
            {["parent", "child"].map((r) => (
              <button key={r} type="button" onClick={() => setForm({ ...form, role: r })} data-testid={`role-${r}`} className={`px-4 py-3 rounded-2xl font-medium border transition-colors ${form.role === r ? "bg-forest text-white border-forest" : "bg-white border-border"}`}>
                {r === "parent" ? "Parent" : "Enfant"}
              </button>
            ))}
          </div>
          <div>
            <div className="label-eyebrow text-forest/60 block mb-2">Couleur</div>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, avatar_color: c })} className={`w-10 h-10 rounded-full border-2 transition-all ${form.avatar_color === c ? "border-forest scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          {safes.length > 0 && (
            <select data-testid="profile-safe" value={form.safe_id} onChange={(e) => setForm({ ...form, safe_id: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-border focus:outline-none focus:border-forest bg-white">
              <option value="">Safe (optionnel)</option>
              {safes.map((s) => <option key={s.safe_id} value={s.safe_id}>{s.name}</option>)}
            </select>
          )}
          <DialogFooter><button data-testid="profile-submit" disabled={busy} className="bg-forest text-white px-5 py-2.5 rounded-full font-medium disabled:opacity-50">{busy ? "…" : "Créer"}</button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState([]);
  const [safes, setSafes] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const [p, s] = await Promise.all([api.get("/profiles"), api.get("/safes")]);
      setProfiles(p.data); setSafes(s.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  const remove = async (prof) => {
    if (!window.confirm(`Supprimer le profil « ${prof.name} » ?`)) return;
    await api.delete(`/profiles/${prof.profile_id}`);
    toast.success("Supprimé");
    refresh();
  };

  return (
    <div className="space-y-10">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="label-eyebrow text-forest/50">Profils</div>
          <h1 className="mt-3 font-heading font-light text-5xl tracking-tight">Votre famille.</h1>
          <p className="mt-2 text-forest/70">Chaque enfant a ses propres règles et son safe.</p>
        </div>
        <ProfileDialog safes={safes} onCreated={refresh} />
      </header>

      {loading ? (
        <div className="text-forest/60 text-sm tracking-[0.22em] uppercase animate-pulse">Chargement…</div>
      ) : profiles.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center">
          <h3 className="font-heading text-2xl font-light">Aucun profil pour l'instant.</h3>
          <p className="mt-2 text-forest/60">Ajoutez les membres de votre famille.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {profiles.map((p) => {
            const safe = safes.find((s) => s.safe_id === p.safe_id);
            return (
              <div key={p.profile_id} className="rounded-3xl bg-white border border-border p-6 hover:shadow-lg transition-shadow" data-testid={`profile-card-${p.profile_id}`}>
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-heading font-bold text-xl" style={{ backgroundColor: p.avatar_color }}>
                    {p.name?.[0]?.toUpperCase()}
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${p.role === "parent" ? "bg-forest/10 text-forest" : "bg-terracotta/10 text-terracotta"}`}>
                    {p.role === "parent" ? <Heart size={12} weight="fill" /> : <User size={12} weight="fill" />}
                    {p.role === "parent" ? "Parent" : "Enfant"}
                  </span>
                </div>
                <h3 className="mt-5 font-heading text-2xl font-semibold">{p.name}</h3>
                <div className="mt-1 text-sm text-forest/60">{safe ? `Safe : ${safe.name}` : "Pas de safe assigné"}</div>
                <div className="mt-5 pt-4 border-t border-border">
                  <button onClick={() => remove(p)} data-testid={`delete-profile-${p.profile_id}`} className="text-sm text-destructive hover:underline inline-flex items-center gap-1.5"><Trash size={14} weight="duotone" /> Supprimer</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
