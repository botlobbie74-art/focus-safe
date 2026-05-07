import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, BatteryCharging, Bell, Sparkle, ArrowUpRight, MoonStars, CheckCircle, Phone } from "@phosphor-icons/react";
import { api } from "../context/AuthContext";
import { toast } from "sonner";

const HERO_IMG = "https://static.prod-images.emergentagent.com/jobs/5ef8b386-d27c-482b-b637-1658367b4480/images/fd44bc4628a280494b1fa44dc8effa8c55cb7a4f97dff87d95f520a3e74cbf69.png";
const PRODUCT_IMG = "https://static.prod-images.emergentagent.com/jobs/5ef8b386-d27c-482b-b637-1658367b4480/images/ad122b937a475278cc066db66a582eac5a0d2f461bee1a3461fda0a68ab9a01b.png";
const FAMILY_IMG = "https://images.unsplash.com/photo-1770587899537-23e617e17767?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTJ8MHwxfHNlYXJjaHwyfHxjYWxtJTIwZmFtaWx5JTIwbGl2aW5nJTIwcm9vbSUyMHdhcm0lMjBsaWdodHxlbnwwfHx8fDE3NzgxNDI2OTB8MA&ixlib=rb-4.1.0&q=85";

const SectionLabel = ({ children, num }) => (
  <div className="flex items-center gap-3 text-forest/70">
    {num && <span className="font-mono text-xs tabular-nums">{num}</span>}
    <span className="label-eyebrow">{children}</span>
    <div className="h-px flex-1 bg-forest/15 max-w-[80px]" />
  </div>
);

const Nav = () => (
  <header className="fixed top-0 inset-x-0 z-50">
    <div className="glass border-b border-white/40">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-forest" data-testid="brand-logo">
          <ShieldCheck size={22} weight="duotone" />
          <span className="font-heading text-lg tracking-tight font-semibold">FOCUS SAFE</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-forest/80">
          <a href="#how" className="hover:text-forest" data-testid="nav-how">Comment ça marche</a>
          <a href="#product" className="hover:text-forest" data-testid="nav-product">Produit</a>
          <a href="#trust" className="hover:text-forest" data-testid="nav-trust">Confiance</a>
          <a href="#pricing" className="hover:text-forest" data-testid="nav-pricing">Tarifs</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden sm:inline-flex text-sm text-forest/80 hover:text-forest px-3 py-2" data-testid="nav-login">Se connecter</Link>
          <Link to="/signup" className="inline-flex items-center gap-1.5 bg-forest text-white text-sm font-medium px-4 py-2.5 rounded-full hover:bg-forest-900 transition-all" data-testid="nav-cta-install">
            Installer <ArrowUpRight size={14} weight="bold" />
          </Link>
        </div>
      </div>
    </div>
  </header>
);

const Hero = () => (
  <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
    <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-terracotta/15 blur-3xl pointer-events-none" />
    <div className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full bg-forest/10 blur-3xl pointer-events-none" />
    <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-10 items-center relative">
      <div className="lg:col-span-7">
        <SectionLabel num="01 / Focus Safe">Le contrôle physique des écrans</SectionLabel>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mt-8 font-heading font-light text-[3rem] sm:text-[4.5rem] lg:text-[6rem] leading-[0.95] tracking-tight text-forest"
        >
          Le téléphone reste <span className="italic font-light text-terracotta">sous contrôle</span>,<br />
          sans discussion.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-8 text-lg text-forest/75 max-w-xl leading-relaxed"
        >
          Un coffre physique connecté + une app intelligente pour instaurer des règles d'écran automatiques à la maison. Pas de surveillance. Pas de conflit.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          <Link to="/signup" data-testid="hero-cta-install" className="group inline-flex items-center gap-2 bg-forest text-white px-7 py-4 rounded-full text-base font-medium hover:bg-forest-900 transition-all shadow-lg shadow-forest/20">
            Installer à la maison
            <ArrowUpRight size={18} weight="bold" className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
          <a href="#how" data-testid="hero-cta-how" className="inline-flex items-center gap-2 text-forest px-5 py-4 hover:underline underline-offset-4">
            Voir comment ça marche →
          </a>
        </motion.div>
        <div className="mt-12 flex items-center gap-6 text-xs text-forest/60">
          <div className="flex items-center gap-2"><CheckCircle size={16} weight="duotone" /> Verrou automatique</div>
          <div className="flex items-center gap-2"><CheckCircle size={16} weight="duotone" /> Charge intégrée</div>
          <div className="flex items-center gap-2"><CheckCircle size={16} weight="duotone" /> Alertes en direct</div>
        </div>
      </div>

      <div className="lg:col-span-5 relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-white shadow-2xl shadow-forest/20"
        >
          <img src={HERO_IMG} alt="Focus Safe dans le salon" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-tr from-forest/30 via-transparent to-transparent" />
        </motion.div>
        {/* floating status pill */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="absolute -left-6 bottom-12 glass rounded-2xl p-4 shadow-xl shadow-forest/10 hidden sm:block"
        >
          <div className="label-eyebrow text-forest/60 mb-1.5">État du safe</div>
          <div className="flex items-center gap-3">
            <div className="relative w-2.5 h-2.5">
              <span className="absolute inset-0 rounded-full bg-emerald-500" />
              <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
            </div>
            <div>
              <div className="font-heading text-forest font-semibold">Verrouillé</div>
              <div className="text-xs text-forest/60">Règle « École » active jusqu'à 7h</div>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="absolute -right-4 top-12 glass rounded-2xl p-3 shadow-xl shadow-forest/10 hidden sm:flex items-center gap-2"
        >
          <BatteryCharging size={20} weight="duotone" className="text-emerald-700" />
          <div className="text-sm">
            <div className="font-medium text-forest">98% • En charge</div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

const HowItWorks = () => {
  const steps = [
    { num: "01", icon: <MoonStars size={28} weight="duotone" />, title: "Définis une règle", body: "Choisis les horaires (ex : 21h → 7h) et les jours. La règle s'applique automatiquement." },
    { num: "02", icon: <Phone size={28} weight="duotone" />, title: "Téléphone dans le safe", body: "Place le téléphone à l'intérieur. Le capteur détecte sa présence en moins d'une seconde." },
    { num: "03", icon: <Lock size={28} weight="duotone" />, title: "Verrou & charge auto", body: "Le safe verrouille, charge le téléphone et alerte les parents en cas de tentative d'ouverture." },
  ];
  return (
    <section id="how" className="py-24 lg:py-32 bg-sand relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <SectionLabel num="02">Comment ça marche</SectionLabel>
        <div className="mt-8 grid lg:grid-cols-12 gap-10 items-end">
          <h2 className="lg:col-span-7 font-heading font-light text-4xl sm:text-5xl lg:text-6xl tracking-tight text-forest leading-[1.05]">
            Trois gestes. <span className="italic text-terracotta">Plus aucune négociation.</span>
          </h2>
          <p className="lg:col-span-5 text-forest/70 text-lg leading-relaxed">
            Une règle physique l'emporte toujours sur une promesse. Voilà pourquoi Focus Safe fonctionne là où les apps de contrôle parental échouent.
          </p>
        </div>
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative bg-white rounded-3xl p-8 border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              data-testid={`how-step-${s.num}`}
            >
              <div className="flex items-center justify-between mb-12">
                <span className="font-mono text-xs text-forest/40">{s.num}</span>
                <div className="text-forest p-3 rounded-2xl bg-forest/5">{s.icon}</div>
              </div>
              <h3 className="font-heading text-2xl font-semibold text-forest">{s.title}</h3>
              <p className="mt-3 text-forest/70 leading-relaxed">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Product = () => (
  <section id="product" className="py-24 lg:py-32 relative overflow-hidden">
    <div className="absolute inset-0 sand-grid opacity-50 pointer-events-none" />
    <div className="max-w-7xl mx-auto px-6 lg:px-10 relative">
      <SectionLabel num="03">Le Safe</SectionLabel>
      <div className="mt-8 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 relative">
          <div className="relative aspect-square rounded-[2.5rem] overflow-hidden border border-white bg-forest/5">
            <img src={PRODUCT_IMG} alt="Safe minimaliste" className="w-full h-full object-cover" />
          </div>
          <div className="absolute top-8 -left-4 glass rounded-2xl px-4 py-2.5 shadow-xl text-xs font-medium text-forest hidden sm:block">
            <div className="label-eyebrow text-forest/50 mb-0.5">Batterie</div>
            <div className="text-forest font-heading text-lg font-semibold">98%</div>
          </div>
          <div className="absolute bottom-12 -right-4 glass rounded-2xl px-4 py-2.5 shadow-xl hidden sm:block">
            <div className="label-eyebrow text-forest/50 mb-0.5">Règle</div>
            <div className="text-forest font-heading text-base font-semibold">Nuit · 21h–07h</div>
          </div>
        </div>
        <div className="lg:col-span-6">
          <h2 className="font-heading font-light text-4xl sm:text-5xl text-forest leading-tight tracking-tight">
            Du bois, du métal,<br /><span className="italic text-terracotta">une intelligence discrète.</span>
          </h2>
          <p className="mt-6 text-forest/75 text-lg leading-relaxed">
            Conçu pour s'intégrer comme un objet de design, pas comme un gadget. À l'intérieur : capteurs de présence, serrure électronique, induction Qi, et connexion Wi-Fi sécurisée.
          </p>
          <ul className="mt-10 space-y-4">
            {[
              { icon: <Lock size={18} weight="duotone" />, t: "Serrure électronique", d: "Code maître parent uniquement." },
              { icon: <BatteryCharging size={18} weight="duotone" />, t: "Charge à induction Qi", d: "Le téléphone reste chargé pendant le verrouillage." },
              { icon: <Bell size={18} weight="duotone" />, t: "Bip & alertes", d: "Bip 60 sec si téléphone absent. Notification parent si tentative d'ouverture." },
              { icon: <Sparkle size={18} weight="duotone" />, t: "Mode autonome", d: "Le safe continue de fonctionner même hors Wi-Fi." },
            ].map((f) => (
              <li key={f.t} className="flex items-start gap-4">
                <div className="mt-0.5 p-2 rounded-xl bg-forest/5 text-forest">{f.icon}</div>
                <div>
                  <div className="font-heading font-semibold text-forest">{f.t}</div>
                  <div className="text-sm text-forest/70">{f.d}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>
);

const Trust = () => (
  <section id="trust" className="py-24 lg:py-32 bg-sand">
    <div className="max-w-7xl mx-auto px-6 lg:px-10">
      <SectionLabel num="04">Différence</SectionLabel>
      <div className="mt-8 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 lg:order-2">
          <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden">
            <img src={FAMILY_IMG} alt="Soirée en famille" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="lg:col-span-6 lg:order-1">
          <h2 className="font-heading font-light text-4xl sm:text-5xl text-forest leading-tight tracking-tight">
            Ce n'est <span className="italic text-terracotta">pas</span> une app de surveillance.
          </h2>
          <div className="mt-8 space-y-5 text-forest/80 text-lg leading-relaxed">
            <p>Focus Safe ne lit pas les SMS. Ne traque pas la position. Ne filtre pas TikTok.</p>
            <p>Il fait quelque chose de plus simple — et de plus efficace : <span className="font-semibold text-forest">il enlève le téléphone de l'équation</span> aux moments qui comptent.</p>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 gap-4">
            {[
              { x: false, t: "App de surveillance" },
              { x: false, t: "Contrôle parental classique" },
              { x: true, t: "Règle physique automatique" },
              { x: true, t: "Aucune donnée privée lue" },
            ].map((p, i) => (
              <div key={i} className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${p.x ? "border-forest/20 bg-white" : "border-border bg-muted/40 line-through text-forest/40"}`}>
                {p.x ? (
                  <CheckCircle size={20} weight="duotone" className="text-emerald-700 shrink-0" />
                ) : (
                  <span className="w-5 h-5 rounded-full border-2 border-forest/30 shrink-0" />
                )}
                <span className="text-forest font-medium">{p.t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Pricing = () => (
  <section id="pricing" className="py-24 lg:py-32 relative">
    <div className="max-w-7xl mx-auto px-6 lg:px-10">
      <SectionLabel num="05">Tarifs</SectionLabel>
      <h2 className="mt-8 font-heading font-light text-4xl sm:text-5xl text-forest leading-tight tracking-tight max-w-3xl">
        Achète une fois. <span className="italic text-terracotta">Évolue à ton rythme.</span>
      </h2>
      <div className="mt-14 grid md:grid-cols-2 gap-6">
        <div className="relative rounded-3xl border border-border bg-white p-10 hover:shadow-xl transition-shadow" data-testid="pricing-hardware">
          <div className="label-eyebrow text-forest/60">Hardware</div>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="font-heading text-6xl font-light text-forest">99€</span>
            <span className="text-forest/60">— 199€</span>
          </div>
          <p className="mt-3 text-forest/70">Achat unique du safe physique connecté.</p>
          <ul className="mt-8 space-y-3 text-sm text-forest/80">
            <li className="flex items-center gap-2"><CheckCircle size={16} weight="duotone" className="text-emerald-700" /> Safe + serrure électronique</li>
            <li className="flex items-center gap-2"><CheckCircle size={16} weight="duotone" className="text-emerald-700" /> Charge à induction Qi</li>
            <li className="flex items-center gap-2"><CheckCircle size={16} weight="duotone" className="text-emerald-700" /> App gratuite à vie</li>
            <li className="flex items-center gap-2"><CheckCircle size={16} weight="duotone" className="text-emerald-700" /> Garantie 2 ans</li>
          </ul>
          <Link to="/signup" className="mt-10 inline-flex items-center gap-2 bg-forest text-white px-6 py-3.5 rounded-full font-medium hover:bg-forest-900 transition-colors" data-testid="pricing-buy-hardware">
            Précommander <ArrowUpRight size={16} weight="bold" />
          </Link>
        </div>

        <div className="relative rounded-3xl bg-forest text-white p-10 overflow-hidden" data-testid="pricing-premium">
          <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-terracotta/30 blur-3xl pointer-events-none" />
          <div className="label-eyebrow text-white/60">Premium</div>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="font-heading text-6xl font-light">4,99€</span>
            <span className="text-white/60">/ mois</span>
          </div>
          <p className="mt-3 text-white/70">Pour les foyers exigeants. Annulable à tout moment.</p>
          <ul className="mt-8 space-y-3 text-sm">
            <li className="flex items-center gap-2"><CheckCircle size={16} weight="duotone" className="text-terracotta" /> Plusieurs safes, plusieurs enfants</li>
            <li className="flex items-center gap-2"><CheckCircle size={16} weight="duotone" className="text-terracotta" /> Règles avancées (récurrence, exceptions)</li>
            <li className="flex items-center gap-2"><CheckCircle size={16} weight="duotone" className="text-terracotta" /> Statistiques d'usage écran</li>
            <li className="flex items-center gap-2"><CheckCircle size={16} weight="duotone" className="text-terracotta" /> Mode vacances & week-end</li>
            <li className="flex items-center gap-2"><CheckCircle size={16} weight="duotone" className="text-terracotta" /> Notifications avancées (email + push)</li>
          </ul>
          <Link to="/signup" className="mt-10 inline-flex items-center gap-2 bg-terracotta text-white px-6 py-3.5 rounded-full font-medium hover:bg-terracotta-dark transition-colors" data-testid="pricing-buy-premium">
            Essayer Premium <ArrowUpRight size={16} weight="bold" />
          </Link>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/contact", form);
      toast.success("Message envoyé. On revient vers vous très vite.");
      setForm({ name: "", email: "", message: "" });
    } catch {
      toast.error("Impossible d'envoyer le message.");
    }
  };
  return (
    <footer className="bg-forest text-white relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-terracotta/20 blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 grid lg:grid-cols-12 gap-12 relative">
        <div className="lg:col-span-7">
          <div className="label-eyebrow text-white/50">Une question ?</div>
          <h3 className="mt-6 font-heading font-light text-5xl lg:text-7xl tracking-tight leading-[1] max-w-2xl">
            Écris-nous,<br /><span className="italic text-terracotta">on lit tout.</span>
          </h3>
          <form onSubmit={submit} className="mt-10 max-w-md space-y-3" data-testid="contact-form">
            <input data-testid="contact-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Votre prénom" className="w-full px-5 py-3.5 rounded-full bg-white/10 placeholder-white/40 text-white border border-white/20 focus:outline-none focus:border-terracotta" />
            <input data-testid="contact-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="Votre email" className="w-full px-5 py-3.5 rounded-full bg-white/10 placeholder-white/40 text-white border border-white/20 focus:outline-none focus:border-terracotta" />
            <textarea data-testid="contact-message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required placeholder="Votre message" rows={3} className="w-full px-5 py-3.5 rounded-3xl bg-white/10 placeholder-white/40 text-white border border-white/20 focus:outline-none focus:border-terracotta" />
            <button data-testid="contact-submit" className="inline-flex items-center gap-2 bg-terracotta text-white px-6 py-3 rounded-full font-medium hover:bg-terracotta-dark transition-colors">
              Envoyer <ArrowUpRight size={16} weight="bold" />
            </button>
          </form>
        </div>
        <div className="lg:col-span-5 lg:pl-10">
          <div className="flex items-center gap-2"><ShieldCheck size={20} weight="duotone" /><span className="font-heading text-lg font-semibold">FOCUS SAFE</span></div>
          <p className="mt-4 text-white/70 max-w-sm">Le système qui impose les règles d'écran à la maison, sans conflit.</p>
          <div className="mt-10 grid grid-cols-2 gap-6 text-sm text-white/60">
            <div>
              <div className="label-eyebrow text-white/40 mb-3">Produit</div>
              <a href="#how" className="block py-1 hover:text-white">Fonctionnement</a>
              <a href="#product" className="block py-1 hover:text-white">Le safe</a>
              <a href="#pricing" className="block py-1 hover:text-white">Tarifs</a>
            </div>
            <div>
              <div className="label-eyebrow text-white/40 mb-3">Compte</div>
              <Link to="/login" className="block py-1 hover:text-white">Se connecter</Link>
              <Link to="/signup" className="block py-1 hover:text-white">Créer un compte</Link>
            </div>
          </div>
          <div className="mt-12 text-xs text-white/40">© {new Date().getFullYear()} Focus Safe. Conçu en France.</div>
        </div>
      </div>
    </footer>
  );
};

export default function Landing() {
  useEffect(() => { document.title = "Focus Safe — Le téléphone reste sous contrôle"; }, []);
  return (
    <main className="min-h-screen bg-sand text-forest">
      <Nav />
      <Hero />
      <HowItWorks />
      <Product />
      <Trust />
      <Pricing />
      <Footer />
    </main>
  );
}
