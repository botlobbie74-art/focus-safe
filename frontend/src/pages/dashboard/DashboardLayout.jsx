import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ShieldCheck, Gauge, Clock, Users, BellRinging, GearSix, SignOut, List, X, Lock as LockIcon } from "@phosphor-icons/react";

const navItems = [
  { to: "/dashboard", icon: <Gauge size={20} weight="duotone" />, label: "Vue d'ensemble", end: true, key: "overview" },
  { to: "/dashboard/rules", icon: <LockIcon size={20} weight="duotone" />, label: "Règles", key: "rules" },
  { to: "/dashboard/history", icon: <Clock size={20} weight="duotone" />, label: "Historique", key: "history" },
  { to: "/dashboard/profiles", icon: <Users size={20} weight="duotone" />, label: "Profils", key: "profiles" },
  { to: "/dashboard/alerts", icon: <BellRinging size={20} weight="duotone" />, label: "Alertes", key: "alerts" },
  { to: "/dashboard/settings", icon: <GearSix size={20} weight="duotone" />, label: "Paramètres", key: "settings" },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-sand text-forest flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 border-r border-border bg-white p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-2 mb-12">
          <ShieldCheck size={24} weight="duotone" className="text-forest" />
          <span className="font-heading text-lg font-semibold tracking-tight">FOCUS SAFE</span>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map((it) => (
            <NavLink
              key={it.key}
              to={it.to}
              end={it.end}
              data-testid={`nav-${it.key}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${
                  isActive ? "bg-forest text-white" : "text-forest/75 hover:bg-forest/5"
                }`
              }
            >
              {it.icon}
              <span className="font-medium">{it.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 p-4 rounded-2xl bg-muted/50 border border-border">
          <div className="label-eyebrow text-forest/50 mb-1">Code famille</div>
          <div className="font-mono text-sm font-semibold tracking-wider" data-testid="family-code">{user?.family_code}</div>
        </div>

        <div className="mt-4 flex items-center gap-3 p-3 rounded-2xl">
          <div className="w-10 h-10 rounded-full bg-forest text-white flex items-center justify-center font-heading font-semibold uppercase">
            {user?.picture ? <img src={user.picture} className="w-full h-full rounded-full object-cover" alt="" /> : (user?.name?.[0] || "?")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" data-testid="user-name">{user?.name}</div>
            <div className="text-xs text-forest/60 truncate">{user?.email}</div>
          </div>
          <button onClick={handleLogout} data-testid="logout-button" className="p-2 rounded-xl hover:bg-forest/5 transition-colors text-forest/70" title="Se déconnecter">
            <SignOut size={18} weight="duotone" />
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-white border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} weight="duotone" />
            <span className="font-heading font-semibold tracking-tight">FOCUS SAFE</span>
          </div>
          <button onClick={() => setMobileOpen(true)} className="p-2" data-testid="mobile-menu-open"><List size={22} /></button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-sand p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2"><ShieldCheck size={20} weight="duotone" /><span className="font-heading font-semibold">FOCUS SAFE</span></div>
            <button onClick={() => setMobileOpen(false)} data-testid="mobile-menu-close"><X size={22} /></button>
          </div>
          <nav className="space-y-2">
            {navItems.map((it) => (
              <NavLink key={it.key} to={it.to} end={it.end} onClick={() => setMobileOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-4 py-3.5 rounded-2xl ${isActive ? "bg-forest text-white" : "bg-white border border-border"}`}>
                {it.icon}<span className="font-medium">{it.label}</span>
              </NavLink>
            ))}
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white border border-border text-left">
              <SignOut size={20} weight="duotone" /><span className="font-medium">Se déconnecter</span>
            </button>
          </nav>
        </div>
      )}

      <main className="flex-1 lg:pl-0 pt-14 lg:pt-0">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
