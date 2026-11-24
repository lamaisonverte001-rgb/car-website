# Maison Véloce — Showroom Automobile Contemporain (E-Commerce Multi-Couches)

Storefront e-commerce automobile contemporain en français avec tarification transparente en **Dirhams Marocains (MAD / DH)**, configurateur **multi-couches** (**Teinte × Motorisation × Jantes**), atelier 3D interactif, commande **Paiement à la livraison (COD)** avec confirmation **WhatsApp**, et tableau de bord d'administration sécurisé.

## Architecture & Stack

- **Framework :** Next.js App Router (`output: 'standalone'`) + TypeScript
- **UI & Motion :** Tailwind CSS v4 + Framer Motion
- **Atelier 3D :** Three.js + React Three Fiber + `@react-three/drei` (lazy-loaded côté client avec respect de `prefers-reduced-motion`)
- **Base de données & ORM :** PostgreSQL 16 + Drizzle ORM
  - 4 véhicules européens contemporains : **Véloce Aero 3** (Hatchback), **Véloce Solis GT** (Berline), **Véloce Cortina S** (Coupé), **Véloce Atlas X** (SUV)
  - **Matrice multi-couches (144 variantes SKUs)** : 4 teintes × 3 motorisations × 3 jantes par modèle, chacune avec son SKU unique, prix TTC en MAD et stock individuel
  - **Transactions SQL atomiques** : décrémentation sécurisée du stock à la commande COD et restauration automatique lors d'une annulation
- **Validation & Anti-Spam COD :** Zod + champ honeypot + rate limiting (IP & numéro de téléphone)
- **Authentification Admin :** Better Auth (adaptateur Drizzle + PostgreSQL, inscriptions publiques désactivées)
- **Médias :** Cloudflare R2 (`@aws-sdk/client-s3`) avec repli local (`/public/uploads`) en développement
- **Notifications :** E-mail SMTP instantané via Nodemailer (non-bloquant)
- **Déploiement VPS :** `Dockerfile` multi-stage standalone + `docker-compose.yml` (PostgreSQL + Next.js)

## Démarrage Rapide (Local)

```bash
cp .env.example .env
npm install
docker compose up -d postgres
npm run db:push
npm run db:seed
npm run dev
```

- **Showroom public :** `http://localhost:3000`
- **Espace Admin :** `http://localhost:3000/admin`
- **Compte Admin initial (défini dans `.env`) :** `admin@maison-veloce.ma` / `VeloceAdmin2026!`

## Déploiement Production (Docker VPS)

```bash
cp .env.example .env
# Renseignez BETTER_AUTH_SECRET, ADMIN_PASSWORD, SMTP_* et R2_* dans .env
docker compose up -d --build
docker compose exec web npx drizzle-kit push --force
docker compose exec web npx tsx src/db/seed.ts
```
