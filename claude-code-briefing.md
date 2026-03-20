# Claude Code – Implementierungsauftrag
# WAMOCON Backup Planer APP – v1.0 MVP

> **Dieses Dokument ist der vollständige technische Implementierungsauftrag.**
> Lies es vollständig durch, bevor du mit der Implementierung beginnst.
> Frage bei Unklarheiten nach, bevor du Annahmen triffst.

---

## 1. Projektkontext

**Unternehmen:** WAMOCON GmbH  
**Produkt:** Modulares IT-Management-System – Modul #1: Backup Planer  
**Ziel:** Ablösung des bestehenden WMC Dashboards (rclone-basiert) durch eine moderne Web-App  
**Deadline MVP:** 13.03.2026  
**Hosting:** MacStudio (lokal, macOS), neue IP-Adresse  

### Was existiert bereits
- Laufendes rclone-Setup: OneDrive Business → Synology NAS + Google Drive
- rclone ist auf dem System installiert und konfiguriert
- Drei remotes: `wmc-onedrive:`, `synology-nas:`, `wmc-googledrive:`
- Backup-Skripte (`.bat`) existieren, werden durch die neue App orchestriert

### Was wir bauen
Eine Web-App (React + Node.js) die:
1. Backup-Jobs verwaltet (erstellen, bearbeiten, löschen, manuell starten)
2. rclone-Ausführung orchestriert und Logs speichert
3. Ein Dashboard mit Timeline und Fehleranzeige bietet
4. E-Mail-Benachrichtigungen versendet
5. Zwei Rollen kennt: Admin (voller Zugriff) und Gast (nur lesen)

---

## 2. Technologie-Stack

| Schicht | Technologie | Version |
|---------|-------------|---------|
| Frontend | React + TypeScript | React 18+ |
| Frontend Styling | TailwindCSS | 3.x |
| Backend | Node.js + Express | Node 20 LTS |
| Datenbank | SQLite (via better-sqlite3) | aktuell |
| Scheduling | node-cron | aktuell |
| Auth | JWT (jsonwebtoken) + bcrypt | aktuell |
| E-Mail | Nodemailer | aktuell |
| Prozessmanager | PM2 (für MacStudio Deployment) | aktuell |
| Build-Tool | Vite (Frontend) | aktuell |

---

## 3. Ordnerstruktur

```
wamocon-backup-app/
├── backend/
│   ├── src/
│   │   ├── index.js                 # Express App Entry Point
│   │   ├── database/
│   │   │   ├── db.js                # SQLite Verbindung
│   │   │   └── schema.sql           # Tabellen-Definitionen
│   │   ├── modules/
│   │   │   └── backup/
│   │   │       ├── backup.router.js
│   │   │       ├── backup.service.js   # Kernlogik
│   │   │       ├── rclone.service.js   # rclone Wrapper
│   │   │       └── scheduler.service.js # node-cron
│   │   ├── core/
│   │   │   ├── auth/
│   │   │   │   ├── auth.router.js
│   │   │   │   └── auth.service.js
│   │   │   ├── email/
│   │   │   │   └── email.service.js
│   │   │   └── middleware/
│   │   │       ├── auth.middleware.js  # JWT Prüfung
│   │   │       └── role.middleware.js  # Admin/Gast
│   │   └── config/
│   │       └── config.js              # Umgebungsvariablen
│   ├── .env                           # Secrets (nicht committen!)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── JobsPage.tsx
│   │   │   └── LogsPage.tsx
│   │   ├── components/
│   │   │   ├── JobCard.tsx
│   │   │   ├── Timeline.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── JobForm.tsx
│   │   ├── api/
│   │   │   └── client.ts             # Axios Instance + Interceptors
│   │   └── store/
│   │       └── auth.store.ts         # Zustand (Auth State)
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── README.md
└── ecosystem.config.js               # PM2 Konfiguration
```

---

## 4. Datenbankschema (SQLite)

```sql
-- schema.sql

-- Benutzer
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'guest')),
  email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Backup-Jobs
CREATE TABLE IF NOT EXISTS backup_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  source TEXT NOT NULL,          -- z.B. 'wmc-onedrive:'
  destination TEXT NOT NULL,     -- z.B. 'synology-nas:WMC/Backup' oder JSON für multi-target
  backup_type TEXT NOT NULL CHECK(backup_type IN ('full', 'incremental', 'differential')),
  schedule TEXT NOT NULL,        -- cron expression, z.B. '0 18 * * *'
  retention_days INTEGER DEFAULT 90,
  is_active INTEGER DEFAULT 1,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Backup-Ausführungen (History)
CREATE TABLE IF NOT EXISTS backup_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES backup_jobs(id),
  started_at DATETIME NOT NULL,
  finished_at DATETIME,
  status TEXT CHECK(status IN ('running', 'success', 'failed', 'stopped')),
  exit_code INTEGER,
  error_message TEXT,
  log_file_path TEXT,
  bytes_transferred INTEGER,
  files_transferred INTEGER,
  triggered_by TEXT DEFAULT 'schedule'  -- 'schedule' oder 'manual'
);

-- System-Konfiguration (Key-Value)
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Standard-Einträge für config:
-- smtp_host, smtp_port, smtp_user, smtp_password, smtp_from
-- notify_email_admin
-- rclone_path (Pfad zur rclone-Binary)
```

### Seed-Daten (beim ersten Start)
```javascript
// Erstelle Standard-Admin beim ersten Start falls keine User existieren
// username: 'admin', password: 'admin123' (muss nach erstem Login geändert werden)
// username: 'guest', password: 'guest123', role: 'guest'
```

---

## 5. REST API Spezifikation

### Base URL: `http://localhost:3001/api`

### Auth
```
POST   /auth/login          Body: { username, password } → { token, user }
POST   /auth/logout         Header: Authorization Bearer → 200 OK
GET    /auth/me             Header: Authorization Bearer → { user }
```

### Backup Jobs (Admin only für POST/PUT/DELETE)
```
GET    /jobs                → [ JobObject ]
GET    /jobs/:id            → JobObject
POST   /jobs                Body: JobInput → JobObject
PUT    /jobs/:id            Body: JobInput → JobObject
DELETE /jobs/:id            → 204 No Content
POST   /jobs/:id/run        → { run_id } (startet Job manuell)
POST   /jobs/:id/stop       → 200 OK (stoppt laufenden Job)
```

### Backup Runs (Logs & History)
```
GET    /runs                Query: ?job_id=&limit=50&offset=0 → [ RunObject ]
GET    /runs/:id            → RunObject
GET    /runs/:id/log        → { content: "raw log text" }
GET    /runs/recent         Query: ?days=7 → [ RunObject ] (für Timeline)
```

### Dashboard
```
GET    /dashboard           → { jobs_count, last_runs, upcoming, health }
```

### Config (Admin only)
```
GET    /config              → { smtp_host, smtp_port, ... } (keine Passwörter im Response)
PUT    /config              Body: { key, value } → 200 OK
```

### JobObject (TypeScript Interface)
```typescript
interface BackupJob {
  id: number;
  name: string;
  source: string;
  destination: string | string[];  // Single oder Multi-Target
  backup_type: 'full' | 'incremental' | 'differential';
  schedule: string;                // cron expression
  retention_days: number;
  is_active: boolean;
  last_run?: BackupRun;
  next_run?: string;               // ISO datetime
  created_at: string;
}

interface BackupRun {
  id: number;
  job_id: number;
  job_name?: string;
  started_at: string;
  finished_at?: string;
  status: 'running' | 'success' | 'failed' | 'stopped';
  exit_code?: number;
  error_message?: string;
  bytes_transferred?: number;
  files_transferred?: number;
  triggered_by: 'schedule' | 'manual';
}
```

---

## 6. rclone Integration

### rclone Service (`rclone.service.js`)

```javascript
// Kernfunktionen die implementiert werden müssen:

// 1. Job ausführen
async function runBackupJob(job) {
  // Führt aus: rclone copy SOURCE DEST --progress --transfers=4 --log-file=PATH
  // Speichert PID für späteres Stoppen
  // Gibt run_id zurück
}

// 2. Job stoppen
async function stopBackupJob(runId) {
  // Sendet SIGTERM an den rclone-Prozess
}

// 3. Status prüfen
async function getJobStatus(runId) {
  // Liest exit code und Status aus DB
}

// 4. rclone verfügbar prüfen
async function checkRcloneHealth() {
  // Führt 'rclone version' aus und prüft Remotes
  // Gibt { onedrive: 'ok', nas: 'ok', gdrive: 'ok' } zurück
}
```

### Wichtige rclone-Flags
```bash
# Standard Backup-Befehl
rclone copy SOURCE DEST \
  --progress \
  --transfers=4 \
  --log-file=/logs/backup_JOBID_TIMESTAMP.log \
  --log-level INFO \
  --stats 60s

# Für Inkrementell: nutze --update (nur neuere Dateien)
# Für Differenziell: nutze --update + Timestamp-Vergleich
```

### Log-Dateipfad Konvention
```
/var/log/wamocon-backup/YYYY-MM-DD/job_ID_TIMESTAMP.log
```

---

## 7. Scheduler Service

```javascript
// scheduler.service.js
// Beim App-Start: alle aktiven Jobs aus DB laden und Crons registrieren

const scheduledJobs = new Map(); // job_id → cron instance

async function initializeScheduler() {
  const activeJobs = db.prepare('SELECT * FROM backup_jobs WHERE is_active = 1').all();
  activeJobs.forEach(job => scheduleJob(job));
}

function scheduleJob(job) {
  // node-cron Task erstellen
  // Bei Ausführung: rclone.service.runBackupJob(job) aufrufen
  // Bei Fehler: email.service.sendFailureNotification() aufrufen
  // Bei Erfolg: email.service.sendSuccessNotification() aufrufen
}

function unscheduleJob(jobId) {
  // Cron Task stoppen und aus Map entfernen
}
```

---

## 8. E-Mail Service

```javascript
// email.service.js (Nodemailer)

// Funktionen:
// sendFailureNotification(job, run, errorMessage)
// sendSuccessNotification(job, run)
// sendWeeklyReport(jobs, runs)   → v1.1
// sendMonthlyReport(jobs, runs)  → v1.1

// E-Mail Templates:
// Fehler: Betreff "⚠️ Backup fehlgeschlagen: [Job-Name]"
//         Body: Job-Name, Startzeit, Fehlergrund, Log-Auszug (letzte 20 Zeilen)
// Erfolg: Betreff "✅ Backup erfolgreich: [Job-Name]"
//         Body: Job-Name, Dauer, übertragene Dateien/Bytes
```

---

## 9. Auth & Middleware

```javascript
// JWT Konfiguration
// - Secret: aus .env (JWT_SECRET)
// - Expiry: 8 Stunden (Session-Timeout Anforderung)
// - Payload: { userId, username, role }

// auth.middleware.js
// Prüft Authorization: Bearer TOKEN Header
// Gibt 401 bei ungültigem/abgelaufenem Token

// role.middleware.js
// requireAdmin: Gibt 403 zurück wenn role !== 'admin'
// requireAuth:  Gibt 401 zurück wenn nicht eingeloggt (Admin und Gast erlaubt)
```

---

## 10. Frontend – Wichtige UI-Komponenten

### Dashboard Page
- **Status-Banner oben:** Backup läuft gerade? → Blauer Banner mit aktivem Job
- **Timeline-Vorschau:** Letzte 7 Tage als horizontale Leiste, jeder Tag mit Status-Dot (grün/rot/grau)
- **Job-Karten:** Jeder Job als Card mit Name, letzter Status, nächster Ausführung, Quick-Start Button (nur Admin)
- **Health-Widgets:** Token & Service Health (OneDrive OK / NAS OK / GDrive OK)

### Jobs Page
- Tabelle aller Jobs mit Inline-Actions (Edit, Delete, Run)
- "+ Neuen Job erstellen" Button öffnet Seitenleiste/Modal mit Formular

### Job Form (Felder)
```
Name*           Text Input
Quelle*         Select: wmc-onedrive: | synology-nas: | (weitere)
Ziel(e)*        Multi-Select: synology-nas:WMC/Backup | wmc-googledrive:Backup
Backup-Typ*     Select: Vollbackup | Inkrementell | Differenziell
Zeitplan*       Cron-Builder ODER Vorauswahl: Täglich 18:00 | Wöchentlich So 18:00 | Monatlich
Aufbewahrung    Select: 7 Tage | 30 Tage | 90 Tage | 180 Tage | 365 Tage | Unbegrenzt
Aktiv           Toggle
```

### Logs Page
- Tab-Navigation: je ein Tab pro Job
- Backup-Dates Sidebar (wie im aktuellen WMC Dashboard)
- Log-Inhalt im Code-Block (monospace)

### Status Badge Farben
```
running  → Blau  (#3B82F6)
success  → Grün  (#22C55E)
failed   → Rot   (#EF4444)
stopped  → Gelb  (#F59E0B)
unknown  → Grau  (#9CA3AF)
```

---

## 11. Umgebungsvariablen (.env)

```env
# Server
PORT=3001
NODE_ENV=production

# Auth
JWT_SECRET=CHANGE_THIS_TO_RANDOM_256BIT_SECRET

# Datenbank
DB_PATH=./data/wamocon.db

# rclone
RCLONE_PATH=/usr/local/bin/rclone
RCLONE_LOG_DIR=/var/log/wamocon-backup

# E-Mail (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=backup@wamocon.com
SMTP_PASSWORD=CHANGE_THIS
SMTP_FROM="WAMOCON Backup <backup@wamocon.com>"
NOTIFY_EMAIL=admin@wamocon.com
```

---

## 12. PM2 Deployment (MacStudio)

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'wamocon-backup-backend',
      script: './backend/src/index.js',
      env: { NODE_ENV: 'production' },
      restart_delay: 5000,
      max_restarts: 10,
      log_file: '/var/log/wamocon-backup/app.log',
    }
  ]
};
```

```bash
# Setup Befehle auf MacStudio:
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Autostart bei MacStudio Neustart
```

### Frontend Build
```bash
cd frontend && npm run build
# Output: frontend/dist/
# Backend serviert dist/ als statische Dateien unter '/'
```

---

## 13. Implementierungsreihenfolge (Tag für Tag)

### Tag 1 – Fundament (Stories S-01 bis S-03)
1. Mono-Repo anlegen: `wamocon-backup-app/`
2. Backend: Express + SQLite Setup, schema.sql ausführen, Seed-User
3. Frontend: Vite + React + TypeScript + TailwindCSS Setup
4. Auth-System: Login API, JWT, bcrypt, Login-Page Frontend
5. Basis-Routing Frontend (React Router): `/login`, `/dashboard`, `/jobs`, `/logs`

### Tag 2 – Backend Core (Stories S-04 bis S-07)
1. Job CRUD API vollständig implementieren
2. rclone.service.js: runBackupJob, checkHealth
3. scheduler.service.js: initializeScheduler, scheduleJob
4. Log-Parser: rclone Output → strukturierte DB-Einträge
5. `/dashboard` API Endpoint

### Tag 3 – Frontend Core (Stories S-08 bis S-10)
1. API Client (Axios mit JWT Interceptor)
2. Dashboard Page: Status-Banner, Job-Cards, Health-Widgets
3. Timeline-Komponente
4. Jobs Page: Tabelle + Job Form Modal
5. Fehleranzeige mit Log-Auszug

### Tag 4 – Features & Tests (Stories S-11 bis S-15)
1. email.service.js: Nodemailer, Failure + Success Templates
2. Failure/Success Hooks in scheduler.service.js einbauen
3. role.middleware.js: Admin/Gast Absicherung aller Endpoints
4. Session-Timeout (JWT 8h + Frontend-Redirect)
5. Unit Tests: auth.service, backup.service, rclone.service
6. Integrationstest: Job erstellen → starten → Log prüfen → E-Mail

### Tag 5 – Abschluss (Stories S-16 bis S-18)
1. Systemtest: alle TC-01 bis TC-09 durchführen, dokumentieren
2. Bugfixing offener P1/P2 Issues
3. Frontend Build: `npm run build`
4. MacStudio Deployment: PM2 Setup, Autostart
5. UAT mit Auftraggeber
6. README.md schreiben
7. Abnahmeprotokoll ausfüllen

---

## 14. Was NICHT in v1.0 implementiert wird

Diese Features kommen in späteren Versionen – **nicht implementieren, nicht vorbereiten**:

- ❌ Kalenderansicht (→ v1.1)
- ❌ Backup-Typen Auswahl (→ v1.1, v1.0 nur Vollbackup)
- ❌ Wöchentlicher/Monatlicher Bericht (→ v1.1)
- ❌ Retention-Konfiguration (→ v1.1, v1.0 fest 90 Tage)
- ❌ 3-2-1 Risikobewertung (→ v1.1)
- ❌ Notebook-Backup (→ v1.2)
- ❌ GitHub-Backup (→ v1.2)
- ❌ Systemverwaltung/Assets (→ v1.2)
- ❌ Network Monitor Modul (→ v2.0)

---

## 15. Erfolgskriterien (Definition of Done v1.0)

Die Implementierung ist abgeschlossen wenn:

- [ ] `npm start` startet Backend auf Port 3001 ohne Fehler
- [ ] `npm run dev` startet Frontend auf Port 5173 ohne Fehler
- [ ] Login als Admin und Guest funktioniert
- [ ] Backup-Job kann erstellt, bearbeitet, gelöscht werden
- [ ] Job kann manuell gestartet werden, rclone-Prozess läuft
- [ ] Log wird gespeichert und ist in der UI lesbar
- [ ] Fehlgeschlagener Job zeigt Fehlergrund in UI
- [ ] E-Mail-Benachrichtigung bei Fehler wird gesendet
- [ ] Gast-User sieht keine Edit/Start/Delete Buttons
- [ ] App ist via PM2 auf MacStudio deployed und erreichbar
- [ ] README.md enthält: Installation, Konfiguration, Erste Schritte

---

*Dokument erstellt: 09.03.2026 | WAMOCON GmbH | Projektmanager*
*Dieses Briefing ist für Claude Code optimiert – kein Vorwissen aus vorherigen Chats vorhanden.*

---

## 16. Aktueller Deployment-Status (Stand: 19.03.2026)

> **Architektur wurde gegenüber dem ursprünglichen Plan geändert.**

### Tatsächliche Architektur (Produktion)

| Schicht | Technologie | Status |
|---------|-------------|--------|
| Frontend | Vercel (deployed) | ✅ Läuft |
| Datenbank | Supabase (PostgreSQL, Cloud) | ✅ Läuft |
| Backend | Node.js auf Mac Mini, Port 3001 | ⏳ Noch einzurichten |
| Tunnel | Cloudflare Tunnel `wamocon-backup` auf Mac Mini | ✅ Läuft, Status Healthy |

### Cloudflare Tunnel Details
- **Tunnel-ID:** `9ef20a58-fce1-4ce7-a242-0a7c361360bc`
- **Öffentliche URL:** `https://9ef20a58-fce1-4ce7-a242-0a7c361360bc.cfargotunnel.com`
- **Routing:** `cfargotunnel.com` → `localhost:3001`
- **PID:** aktiv (via `cloudflared`)

### Vercel Frontend
- **VITE_API_URL** muss gesetzt werden auf:  
  `https://9ef20a58-fce1-4ce7-a242-0a7c361360bc.cfargotunnel.com/api`
- Nach Setzen der Env-Variable: Vercel Redeploy auslösen

### Was bereits erledigt ist
1. ✅ Cloudflare Tunnel `wamocon-backup` auf Mac Mini installiert und läuft
2. ✅ Tunnel via API konfiguriert (leitet auf `localhost:3001`)
3. ✅ Node.js auf dem Mac Mini installiert (via Homebrew)
4. ✅ Repo geklont nach `~/backup-planner`

### Nächste offene Schritte (auf dem Mac Mini ausführen)

```bash
cd ~/backup-planner/wamocon-backup-app/backend
npm install

# .env aus Huawei-Notebook kopieren oder manuell anlegen:
cp .env.example .env
nano .env
# Einzutragende Werte:
#   SUPABASE_URL=...
#   SUPABASE_KEY=...  (Service Role Key)
#   JWT_SECRET=...    (gleicher Wert wie bisher)
#   ALLOWED_ORIGINS=https://<deine-vercel-url>.vercel.app
#   PORT=3001
#   NODE_ENV=production

# PM2 global installieren
npm install -g pm2

# Backend starten
pm2 start src/index.js --name wamocon-backup-backend
pm2 save
pm2 startup   # Copy & Paste den ausgegebenen Befehl
```

Dann im **Vercel Dashboard**:
1. Settings → Environment Variables
2. `VITE_API_URL` = `https://9ef20a58-fce1-4ce7-a242-0a7c361360bc.cfargotunnel.com/api`
3. Redeploy auslösen
4. Login unter der Vercel-URL testen

### Hinweise zur geänderten Architektur
- **SQLite wurde durch Supabase (PostgreSQL) ersetzt** – das Backend-Schema und die DB-Verbindung (`db.js`) müssen entsprechend angepasst sein oder wurden bereits angepasst.
- **Frontend liegt auf Vercel**, nicht lokal auf dem Mac Mini.
- **Backend läuft auf dem Mac Mini** und ist über den Cloudflare Tunnel erreichbar – kein direktes Port-Forwarding am Router nötig.
- `ALLOWED_ORIGINS` im Backend muss die Vercel-Domain enthalten (CORS).
