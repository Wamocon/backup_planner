# WAMOCON Backup Planer

Ein ganzheitliches, webbasiertes System zur zentralen Steuerung, Planung und Überwachung von Backup-Aufgaben. 

Dieses Tool vereint die Flexibilität von **rclone** für Cloud/NAS-Backups, von **UrBackup** für klassische Notebook, Mac- & PC-Sicherungen, sowie ein übersichtliches **React-Dashboard** mit integrierter Kalender-Übersicht.

---

## Funktionen

- **Zentrales Dashboard:** Schneller Überblick über erfolgreiche, laufende und fehlgeschlagene Backups, sowie aktuelle Systemkapazitäten.
- **Job-Verwaltung:** Anlegen, Bearbeiten und Löschen von rclone Backup-Plänen. Unterstützung von Vollbackups (Sync) und Inkrementellen Backups (Copy).
- **Kalender-Übersicht:** Planen und Visualisieren der Backup-Routinen anhand von Cron-Ausdrücken (`cron-parser` Integration).
- **Integrierte Notebook-Sicherung:** Anleitung und nahtlose Integration von **UrBackup** zur Sicherung von ganzen Laufwerken und Ordnern auf Endgeräten (Windows & macOS).
- **Log-Viewer:** Direkter Einblick in die Ausführungsprotokolle (Logs) von rclone, inklusive Filterung nach Fehlern.
- **Integrierte Hilfe:** Umfangreiches, durchsuchbares App-Handbuch mit Erklärungen zur Infrastruktur, 3-2-1 Regel und Problembehebungs-Guides.

---

## Architektur & Tech-Stack

Das Projekt besteht aus zwei Hauptkomponenten: einem REST-Backend (Node.js) und einem Frontend (React).

1. **Backend (`/backend`)**
   - **Laufzeitumgebung:** Node.js mit Express.js
   - **Datenbank:** SQLite (`data/database.sqlite`) zur Speicherung von Jobs, Protokollen und Logs.
   - **Kernkomponente:** Führt im Hintergrund auf dem Server (Mac Studio) die `rclone`-Kommandozeilenbefehle via `child_process` basierend auf einem Cron-Scheduler aus.
   - **Module:** `node-cron` für das Scheduling, `sqlite3` für die DB.

2. **Frontend (`/frontend`)**
   - **Framework:** React 19 (via Vite)
   - **Styling:** Tailwind CSS V4 + integrierte UI Komponenten (`lucide-react` Icons).
   - **State-Management:** `zustand`
   - **Netzwerk:** `axios` für die Kommunikation zur REST-API (`http://localhost:3000/api`).

---

## Installation & Setup

Voraussetzung: Node.js (v18+) sowie ein lokal eingerichtetes `rclone` (mit entsprechenden Remote-Configs, z.B. `wmc-onedrive:`).

### 1. Repository klonen

```bash
git clone <repository_url>
cd wamocon-backup-app
```

### 2. Backend starten

Öffne ein Terminal und wechsle ins Backend-Verzeichnis:

```bash
cd backend
npm install
npm run dev
```

Das Backend initialisiert automatisch die SQLite Datenbank (sofern noch nicht vorhanden) und lauscht auf Port `3000`.

### 3. Frontend starten

Öffne ein zweites Terminal und wechsle ins Frontend-Verzeichnis:

```bash
cd frontend
npm install
npm run dev
```

Das Frontend wird auf `http://localhost:5173` gestartet.

### 4. UrBackup (Notebook / Client Sicherung)

Um Notebooks (Windows, Mac) automatisch im Firmen- bzw. HeimNetzwerk zu sichern, betreiben wir UrBackup im Docker-Container. Eine entsprechende `docker-compose.yml` Anleitung sowie Hinweise zum Client-Download finden sich direkt in der App auf der Seite **"Hilfe & Erklärung"**.

---

## Nutzung & Erstkonfiguration

1. Rufe das **Frontend** im Browser auf.
2. Der Standard-Login für Demonstrationszwecke ist oft in der `auth.store.ts` bzw. im Backend hinterlegt (z.B. User: `admin`, Passwort: `password` - **Achtung: Dies ist nur für das Dev-Environment**).
3. Navigiere zu **Backup Plans** (Kalender oder Tabelle) und erstelle einen neuen Job. Wähle dazu die in `rclone config` auf dem Hostsystem angelegten Quellen und Ziele aus (z.B. `/Users/Shared/Data` als Quelle und `wmc-onedrive:/Backup` als Ziel).

Weitere Benutzungshinweise findest du im Reiter **Hilfe & Erklärung**, dort gibt es ein integriertes Handbuch mit Live-Suche.
