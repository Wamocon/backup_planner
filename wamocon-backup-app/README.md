# WAMOCON Backup Planer APP

## Overview
Ein modulares IT-Management-System auf Basis von React und Node.js zur Orchestrierung von rclone Backups (OneDrive → Synology NAS / Google Drive).

## Installation

### Voraussetzungen
- Node.js (v20 LTS empfohlen)
- rclone (installiert und konfiguriert für das System)
- PM2 (für lokales Daemon-Deployment)

```bash
# Globale Abhängigkeiten
npm install -g pm2
```

### Setup Backend
```bash
cd backend
npm install
cp .env.example .env # Erstellen Sie die .env Datei mit entsprechenden Werten
```

### Setup Frontend & Build
```bash
cd frontend
npm install
npm run build
```
Note: Currently the backend does not serve the frontend static files by default, it expects you to run it using an NGINX proxy, or simply via `npm run dev` during MVP testing.

## Starten

### Entwicklung
Backend: `cd backend && npm run dev`
Frontend: `cd frontend && npm run dev`

### Produktion (MacStudio)
Rendert den Backend-Service dauerhaft im Hintergrund.
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Auth
Standardnutzer (werden beim ersten Start angelegt):
- Admin: `admin` / `admin123`
- Guest: `guest` / `guest123`
