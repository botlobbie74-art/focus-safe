# FOCUS SAFE — PRD

## Original problem statement
🧠 NOM DU PRODUIT (base) : FOCUS SAFE — "Le système qui impose les règles d'écran à la maison, sans conflit."

Landing page publique + Web app dashboard parents pour contrôler un coffre physique connecté qui range les téléphones selon des règles horaires (ex: 21h–7h école). Le safe verrouille automatiquement quand le téléphone est dedans, déclenche un bip si absent, envoie alertes aux parents en cas de tentative d'ouverture.

## User personas
- **Parent 30–50 ans** : veut reprendre le contrôle des écrans à la maison sans conflit, n'aime pas les apps de surveillance intrusives.
- **Conjoint·e** : rejoint la famille via le `family_code`.
- **Enfant** : profil dans le dashboard, règles personnalisées.

## Architecture
- **Backend** : FastAPI + MongoDB (motor). Auth: JWT (email/password) + Emergent Google OAuth (cookie httpOnly).
- **Frontend** : React 19 + Tailwind + Shadcn/UI + framer-motion + @phosphor-icons/react (duotone).
- **Email** : Resend (API key in `.env`).
- **Hardware-ready endpoints** :
  - `POST /api/safes/{id}/status` — push de statut temps réel (phone_present, locked, battery, etc.)
  - `POST /api/safes/{id}/events` — push d'événements (placed, locked, open_attempt…). Crée alertes critiques + email.

## Implementation log
### 2026-02 — MVP v1
- Backend complet : auth (JWT + Google), safes, rules, profiles, events, alerts, settings, contact, dashboard summary.
- Resend email pipeline pour alertes critiques.
- Landing page premium (Hero, How it works, Product, Trust, Pricing, Footer + contact form).
- Auth pages split-screen avec Google OAuth.
- Dashboard layout avec sidebar (overview, rules, history, profiles, alerts, settings).
- Design system : Outfit + Manrope, palette forest #1A3636 + terracotta #E07A5F + sand #FAF9F6.

## What's implemented
- ✅ Landing page complète avec 5 sections + contact
- ✅ Auth JWT (signup/login) + Emergent Google OAuth
- ✅ Dashboard home avec stats + safes
- ✅ CRUD règles avec sélecteur jours/heures + switches
- ✅ CRUD profils famille (parents/enfants)
- ✅ Timeline historique des événements
- ✅ Centre d'alertes avec sévérité + mark-as-read
- ✅ Settings (master code, vacation/weekend, email/push toggles)
- ✅ Email transactionnels via Resend pour alertes critiques
- ✅ Endpoints hardware-ready pour futur safe physique

## P0 backlog (non-blocking, peut être ajouté ensuite)
- Push notifications navigateur (service worker + VAPID)
- Stripe pour paiement Premium 4,99€/mois
- Page admin pour précommandes (tracking contacts)
- Statistiques d'usage écran (Premium)

## P1 backlog
- Mode focus immédiat (1–4h, cron côté serveur)
- Règles avancées (récurrence, exceptions vacances)
- Multi-langue (en plus du français)

## Test credentials
Voir `/app/memory/test_credentials.md`.
