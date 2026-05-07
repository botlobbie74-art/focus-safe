import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowLeft, GoogleLogo } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

const ABSTRACT_BG = "https://static.prod-images.emergentagent.com/jobs/5ef8b386-d27c-482b-b637-1658367b4480/images/18c61c7eab864618fd54a6516ddfbfbcc54cfa2e7c5ee44e88e3730331cc68e9.png";

export default function Login() {
  const { loginWithPassword, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await loginWithPassword(email, password);
      toast.success("Connecté");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Identifiants invalides");
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
      <div className="flex flex-col justify-between p-8 lg:p-14">
        <Link to="/" className="inline-flex items-center gap-2 text-forest" data-testid="back-home">
          <ArrowLeft size={16} /> <ShieldCheck size={20} weight="duotone" /> <span className="font-heading font-semibold tracking-tight">FOCUS SAFE</span>
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-md w-full mx-auto">
          <div className="label-eyebrow text-forest/50 mb-3">Bon retour</div>
          <h1 className="font-heading font-light text-5xl tracking-tight text-forest">Se connecter</h1>
          <p className="mt-3 text-forest/70">Accédez au tableau de bord de votre safe.</p>

          <button data-testid="login-google" onClick={googleLogin} className="mt-10 w-full inline-flex items-center justify-center gap-3 bg-white border border-border px-5 py-3.5 rounded-full hover:border-forest/40 transition-colors font-medium text-forest">
            <GoogleLogo size={20} weight="fill" /> Continuer avec Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-forest/40 label-eyebrow">
            <div className="h-px flex-1 bg-border" /> ou avec email <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-3" data-testid="login-form">
            <input data-testid="login-email" required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-5 py-3.5 rounded-2xl bg-white border border-border focus:outline-none focus:border-forest text-forest placeholder-forest/40" />
            <input data-testid="login-password" required type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-3.5 rounded-2xl bg-white border border-border focus:outline-none focus:border-forest text-forest placeholder-forest/40" />
            <button data-testid="login-submit" disabled={busy} className="w-full bg-forest text-white py-3.5 rounded-full font-medium hover:bg-forest-900 transition-colors disabled:opacity-50">
              {busy ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          <p className="mt-8 text-sm text-forest/70">
            Pas encore de compte ? <Link to="/signup" className="text-forest font-semibold hover:underline" data-testid="link-signup">Créer un compte</Link>
          </p>
        </motion.div>

        <div className="text-xs text-forest/40">© Focus Safe</div>
      </div>

      <div className="hidden lg:flex relative overflow-hidden bg-forest">
        <img src={ABSTRACT_BG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" />
        <div className="relative z-10 flex flex-col justify-end p-14 text-white">
          <div className="label-eyebrow text-white/60 mb-4">Manifeste</div>
          <p className="font-heading font-light text-3xl lg:text-4xl leading-tight max-w-md">
            « Le meilleur contrôle parental, c'est celui qui n'a pas besoin d'arguments. »
          </p>
        </div>
      </div>
    </div>
  );
}
