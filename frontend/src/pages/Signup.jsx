import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowLeft, GoogleLogo, Sparkle } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

const ABSTRACT_BG = "https://static.prod-images.emergentagent.com/jobs/5ef8b386-d27c-482b-b637-1658367b4480/images/18c61c7eab864618fd54a6516ddfbfbcc54cfa2e7c5ee44e88e3730331cc68e9.png";

export default function Signup() {
  const { signup, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", family_code: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) navigate("/dashboard"); }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error("Mot de passe : 6 caractères minimum."); return; }
    setBusy(true);
    try {
      await signup({ ...form, family_code: form.family_code || undefined });
      toast.success("Bienvenue dans Focus Safe");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Inscription impossible");
    } finally {
      setBusy(false);
    }
  };

  const googleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-sand">
      <div className="flex flex-col justify-between p-8 lg:p-14 order-2 lg:order-1">
        <Link to="/" className="inline-flex items-center gap-2 text-forest" data-testid="back-home">
          <ArrowLeft size={16} /> <ShieldCheck size={20} weight="duotone" /> <span className="font-heading font-semibold tracking-tight">FOCUS SAFE</span>
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-md w-full mx-auto py-10">
          <div className="label-eyebrow text-forest/50 mb-3">Créer un compte</div>
          <h1 className="font-heading font-light text-5xl tracking-tight text-forest">Reprenez le contrôle.</h1>
          <p className="mt-3 text-forest/70">Quelques secondes suffisent. Aucun engagement.</p>

          <button data-testid="signup-google" onClick={googleLogin} className="mt-8 w-full inline-flex items-center justify-center gap-3 bg-white border border-border px-5 py-3.5 rounded-full hover:border-forest/40 transition-colors font-medium text-forest">
            <GoogleLogo size={20} weight="fill" /> S'inscrire avec Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-forest/40 label-eyebrow">
            <div className="h-px flex-1 bg-border" /> ou avec email <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-3" data-testid="signup-form">
            <input data-testid="signup-name" required placeholder="Votre prénom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-5 py-3.5 rounded-2xl bg-white border border-border focus:outline-none focus:border-forest text-forest placeholder-forest/40" />
            <input data-testid="signup-email" required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-5 py-3.5 rounded-2xl bg-white border border-border focus:outline-none focus:border-forest text-forest placeholder-forest/40" />
            <input data-testid="signup-password" required type="password" placeholder="Mot de passe (6+ caractères)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-5 py-3.5 rounded-2xl bg-white border border-border focus:outline-none focus:border-forest text-forest placeholder-forest/40" />
            <input data-testid="signup-family-code" placeholder="Code famille (optionnel — laissez vide pour créer)" value={form.family_code} onChange={(e) => setForm({ ...form, family_code: e.target.value })} className="w-full px-5 py-3.5 rounded-2xl bg-white border border-border focus:outline-none focus:border-forest text-forest placeholder-forest/40" />
            <p className="text-xs text-forest/50 px-2 flex items-start gap-2">
              <Sparkle size={14} weight="duotone" className="mt-0.5 shrink-0 text-terracotta" />
              Le code famille relie votre compte à un safe existant. Laissez vide pour créer une nouvelle famille.
            </p>
            <button data-testid="signup-submit" disabled={busy} className="w-full bg-forest text-white py-3.5 rounded-full font-medium hover:bg-forest-900 transition-colors disabled:opacity-50">
              {busy ? "Création…" : "Créer mon compte"}
            </button>
          </form>

          <p className="mt-6 text-sm text-forest/70">
            Déjà un compte ? <Link to="/login" className="text-forest font-semibold hover:underline" data-testid="link-login">Se connecter</Link>
          </p>
        </motion.div>

        <div className="text-xs text-forest/40">© Focus Safe</div>
      </div>

      <div className="hidden lg:flex relative overflow-hidden bg-forest order-1 lg:order-2">
        <img src={ABSTRACT_BG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" />
        <div className="relative z-10 flex flex-col justify-end p-14 text-white">
          <div className="label-eyebrow text-white/60 mb-4">Vos enfants vont vous remercier (un jour)</div>
          <p className="font-heading font-light text-3xl lg:text-4xl leading-tight max-w-md">
            « Plus jamais de "encore 5 minutes" qui se transforment en deux heures. »
          </p>
        </div>
      </div>
    </div>
  );
}
