# WAMOCON Backup Planner – Task Tracking

> Letzte Aktualisierung: 20.03.2026

---

## ✅ Abgeschlossen

### Fundament & Infrastruktur
- [x] Mono-Repo Struktur angelegt (`wamocon-backup-app/`)
- [x] Backend: Express + Supabase/PostgreSQL Setup (abweichend vom Plan: SQLite → Supabase)
- [x] Frontend: Vite + React + TypeScript + TailwindCSS Setup
- [x] Auth-System: Login API, JWT (8h), bcrypt, Seed-User (admin/guest)
- [x] Basis-Routing Frontend: `/login`, `/dashboard`, `/jobs`, `/logs`
- [x] `.env.example` (Backend + Frontend) angelegt
- [x] `ecosystem.config.js` (PM2) angelegt

### Backend Core
- [x] Job CRUD API vollständig (`backup.router.js`, `backup.service.js`)
- [x] `rclone.service.js`: `runBackupJob`, `stopBackupJob`, `checkRcloneHealth`
- [x] `scheduler.service.js`: `initializeScheduler`, `scheduleJob`, `unscheduleJob`
- [x] `email.service.js`: `sendFailureNotification`, `sendSuccessNotification`
- [x] `role.middleware.js`: `requireAdmin` (403 Guard)
- [x] `auth.middleware.js`: JWT-Prüfung (401 Guard)
- [x] `runs.router.js`: Backup-History API
- [x] `dashboard.router.js`: Dashboard API Endpoint
- [x] `settings.router.js`: Konfiguration API

### Frontend Core
- [x] API Client (`client.ts`) mit JWT Interceptor
- [x] `auth.store.ts` (Zustand)
- [x] `LoginPage.tsx`
- [x] `DashboardPage.tsx`
- [x] `JobsPage.tsx`
- [x] `LogsPage.tsx`
- [x] `JobModal.tsx` (Job erstellen/bearbeiten)
- [x] `JobCard.tsx`, `Timeline.tsx`, `Toast.tsx`, `Layout.tsx`, `ConfirmModal.tsx`

### Deployment-Infrastruktur
- [x] Cloudflare Tunnel auf Mac Mini installiert und läuft (`wamocon-backup`)
- [x] Node.js auf Mac Mini installiert (Homebrew)
- [x] Repo auf Mac Mini geklont (`~/backup-planner`)
- [x] Frontend auf Vercel deployed

---

## ⏳ In Bearbeitung / Offen

### Mac Mini Backend-Deployment
- [ ] `npm install` auf Mac Mini ausführen
- [ ] `.env` auf Mac Mini anlegen (SUPABASE_URL, SUPABASE_KEY, JWT_SECRET, ALLOWED_ORIGINS)
- [ ] PM2 global installieren (`npm install -g pm2`)
- [ ] Backend via PM2 starten (`pm2 start src/index.js --name wamocon-backup-backend`)
- [ ] `pm2 save` + `pm2 startup` ausführen (Autostart)

### Vercel Konfiguration
- [ ] `VITE_API_URL` in Vercel Environment Variables setzen
  - Wert: `https://9ef20a58-fce1-4ce7-a242-0a7c361360bc.cfargotunnel.com/api`
- [ ] Vercel Redeploy auslösen
- [ ] Login unter der Vercel-URL testen

### Definition of Done Checks (v1.0)
- [ ] Login als Admin und Guest unter Vercel-URL verifizieren
- [ ] Backup-Job: Erstellen, Bearbeiten, Löschen im Produktivsystem testen
- [ ] Job manuell starten, rclone-Prozess läuft verifizieren
- [ ] Log wird gespeichert und ist in UI lesbar
- [ ] E-Mail-Benachrichtigung bei Fehler testen (SMTP konfigurieren)
- [ ] Gast-User: keine Edit/Start/Delete Buttons verifizieren
- [ ] README.md vervollständigen (Deployment, Konfiguration auf Mac Mini)

---

## ❌ Nicht in v1.0 (Scope-Kontrolle)

> Folgende Features wurden **bereits implementiert**, gehören aber lt. Briefing nicht in v1.0.
> Sind nicht kaputt, aber erhöhen die Komplexität vor dem ersten Deployment.

- `CalendarPage.tsx` → laut Briefing erst v1.1
- `DevicesPage.tsx` + `devices.router.js` → nicht im MVP-Scope
- `macstudio/` Modul (Router + Service) → nicht im MVP-Scope
- `urbackup/` Modul (Router, Service, Sync-Service) → nicht im MVP-Scope
- `ManualPage.tsx`, `HelpPage.tsx`, `ArchitecturePage.tsx` → nicht spezifiziert
- GoBD Backup-Typ in `backup.service.js` → nicht im originalen Spec

---

## 📋 Review-Notizen

### Architektur-Abweichungen (bewusst entschieden)
| Original | Tatsächlich | Grund |
|---|---|---|
| SQLite (better-sqlite3) | Supabase (PostgreSQL via `pg`) | Cloud-Hosting, Multi-Device |
| Lokales Hosting (MacStudio) | Vercel (FE) + Cloudflare Tunnel (BE) | Fernzugriff ohne Router-Config |

### Backend-Startprobleme (lokal auf Windows)
- `node src/index.js` scheiterte mehrfach (Exit Code 1) → wahrscheinlich fehlende `.env`-Werte
- Auf dem Mac Mini (Produktiv) mit korrrekter `.env` sollte es stabil laufen
