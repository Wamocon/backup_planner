# WAMOCON Backup Planner Monorepo

Comprehensive documentation for the complete repository.

This repository contains project planning documents plus the runnable application in:

- `wamocon-backup-app/frontend` (React + Vite)
- `wamocon-backup-app/backend` (Node.js + Express + PostgreSQL)

---

## 1) Repository Structure

Top-level folders/files:

- `wamocon-backup-app/` -> main application
- `tasks/` -> project task notes
- `workflow.md`, `erwinnotes.md`, `claude-code-briefing.md`, `docx_text.txt` -> project/process documentation
- `logs/` -> runtime logs (backend/pm2)

Application structure:

- `wamocon-backup-app/backend/src/core` -> auth, middleware, email
- `wamocon-backup-app/backend/src/modules` -> backup, dashboard, devices, macstudio, settings, urbackup
- `wamocon-backup-app/backend/src/database` -> PostgreSQL init + schema
- `wamocon-backup-app/frontend/src/pages` -> all app pages
- `wamocon-backup-app/frontend/src/components` -> reusable UI
- `wamocon-backup-app/frontend/src/api` -> axios client + auth token handling
- `wamocon-backup-app/ecosystem.config.js` -> PM2 production config

---

## 2) What The System Does

The Backup Planner centralizes backup operations across multiple systems:

- rclone-based backup jobs (scheduled and manual)
- URBackup monitoring and backup triggering for endpoints
- Device owner mapping for URBackup clients
- Mac Studio backup bridge API integration
- Dashboard, logs, calendar, architecture and manual/help pages
- SMTP notifications
- JWT-based login with role-based permissions (admin/guest)

---

## 3) Runtime Architecture (Actual Code State)

## Frontend

- React 19 + TypeScript + Vite
- Route pages:
  - `/dashboard`
  - `/jobs`
  - `/calendar`
  - `/logs`
  - `/architecture`
  - `/devices`
  - `/help`
  - `/manual`
  - `/settings`
  - `/login`
- API access through axios with Bearer token interceptor
- Dev mode uses Vite proxy `/api -> http://localhost:3001`

## Backend

- Node.js + Express (CommonJS)
- PostgreSQL (via `pg`), schema auto-applied on startup
- Tables:
  - `users`
  - `backup_jobs`
  - `backup_runs`
  - `config`
  - `urbackup_clients`
  - `device_owners`
  - `urbackup_backup_history`
- Scheduler:
  - backup jobs with `node-cron`
  - URBackup sync scheduler with `node-cron`
- Uses `child_process.spawn` to run rclone jobs

## External Integrations

- PostgreSQL/Supabase (`DATABASE_URL` required)
- rclone binary + configured remotes
- URBackup server (can run in Docker)
- Optional Mac Studio dashboard API
- Optional SMTP server for e-mail alerts

---

## 4) Prerequisites

Install these before setup:

1. Node.js 18+ (Node 20 LTS recommended)
2. npm 9+
3. PostgreSQL database URL (Supabase is supported)
4. rclone installed on the machine running backend
5. Optional: Docker + Docker Compose (for URBackup server)
6. Optional: PM2 (production process manager)

---

## 5) Quick Start (Minimal Manual Steps)

From repo root:

```bash
git clone <your-repo-url>
cd backup-planner
```

### 5.1 Backend setup

```bash
cd wamocon-backup-app/backend
cp .env.example .env
npm install
```

Edit `.env` and set at minimum:

- `DATABASE_URL`
- `JWT_SECRET`
- `ALLOWED_ORIGINS=http://localhost:5173`

Optional but recommended:

- `RCLONE_PATH` (default: `rclone`)
- `RCLONE_LOG_DIR` (default: `./data/logs`)
- `URBACKUP_URL`, `URBACKUP_USERNAME`, `URBACKUP_PASSWORD`
- `MACSTUDIO_URL`, `MACSTUDIO_API_KEY`
- SMTP fields for notifications

Start backend:

```bash
npm run dev
```

Backend API runs on `http://localhost:3001`.

### 5.2 Frontend setup

In a second terminal:

```bash
cd backup-planner/wamocon-backup-app/frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

### 5.3 Login

On first backend start, DB seed creates users:

- admin / admin123
- guest / guest123

Use admin for creating/editing backup plans.

---

## 6) All Important Commands

## Repo/Application navigation

```bash
cd backup-planner
cd wamocon-backup-app
```

## Backend

```bash
cd wamocon-backup-app/backend
npm install
npm run dev
npm start
```

## Frontend

```bash
cd wamocon-backup-app/frontend
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

## PM2 Production (backend)

```bash
cd backup-planner/wamocon-backup-app
npm install -g pm2
pm2 start ecosystem.config.js
pm2 status
pm2 logs wamocon-backup-backend
pm2 restart wamocon-backup-backend
pm2 save
pm2 startup
```

## rclone sanity check

```bash
rclone version
rclone config
rclone listremotes
```

## URBackup Docker (if hosting URBackup locally)

```bash
cd backup-planner/wamocon-backup-app/deploy/urbackup
docker compose up -d
docker compose ps
docker compose logs -f
```

---

## 7) Environment Variables

## Backend `.env`

Required:

- `PORT` (default 3001)
- `NODE_ENV`
- `DATABASE_URL`
- `JWT_SECRET`
- `ALLOWED_ORIGINS`

Backup/rclone:

- `RCLONE_PATH`
- `RCLONE_LOG_DIR`

URBackup:

- `URBACKUP_URL`
- `URBACKUP_USERNAME`
- `URBACKUP_PASSWORD`
- `URBACKUP_SYNC_SCHEDULE` (cron, default every 15 min)

Mac Studio integration:

- `MACSTUDIO_URL`
- `MACSTUDIO_API_KEY`

SMTP notification:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `NOTIFY_EMAIL`

## Frontend `.env` (mostly production)

- `VITE_API_URL` (example: `https://backup-api.yourdomain.com/api`)

In local dev this is optional because Vite proxy handles `/api`.

---

## 8) URBackup Docker Compose

Checked-in compose file:

- `wamocon-backup-app/deploy/urbackup/docker-compose.yml`

Template content:

```yaml
version: '3'
services:
  urbackup:
    image: uroni/urbackup-server:latest
    container_name: urbackup-server
    restart: unless-stopped
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/Berlin
    volumes:
      - /Volumes/UrBackupStorage/backups:/backups
      - /Volumes/UrBackupStorage/database:/var/urbackup
    ports:
      - "55413-55415:55413-55415"
      - "35623:35623/udp"
```

Important:

- Use an APFS case-sensitive volume on macOS for URBackup storage.
- URBackup-related ports in use:
  - 55414/TCP web UI
  - 55415/TCP internet backups
  - 55413/TCP local discovery
  - 35623/UDP LAN discovery

---

## 9) rclone Setup Expectations

The backend executes rclone commands for jobs and expects remotes to exist on the backend host.

Typical workflow:

```bash
rclone config
rclone listremotes
```

Then create jobs in UI using source/destination remote paths, for example:

- source: `wmc-onedrive:`
- destination: `synology-nas:WMC/Backup`

Backup type behavior in backend:

- full -> `rclone copy`
- incremental -> `rclone copy --update`
- differential -> `rclone copy --update`
- gobd -> `rclone copy --checksum` and retention minimum 3650 days

---

## 10) API Overview

Base URL (local): `http://localhost:3001/api`

Auth:

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

Jobs:

- `GET /jobs`
- `GET /jobs/:id`
- `POST /jobs` (admin)
- `PUT /jobs/:id` (admin)
- `DELETE /jobs/:id` (admin)
- `POST /jobs/:id/run` (admin)

Runs:

- `GET /runs`
- `GET /runs/recent`
- `GET /runs/:id`
- `GET /runs/:id/log`

Dashboard:

- `GET /dashboard`

URBackup:

- `GET /urbackup/status`
- `GET /urbackup/clients`
- `GET /urbackup/history`
- `GET /urbackup/stats`
- `GET /urbackup/calendar`
- `GET /urbackup/live`
- `POST /urbackup/start` (admin)
- `POST /urbackup/sync` (admin)

Devices:

- `GET /devices`
- `PUT /devices/:clientId` (admin)
- `DELETE /devices/:clientId/owner` (admin)

Mac Studio:

- `GET /macstudio/status`
- `GET /macstudio/health`
- `POST /macstudio/trigger` (admin)

Settings:

- `GET /settings` (admin)
- `PUT /settings` (admin)
- `POST /settings/test-email` (admin)

---

## 11) Production Notes

- Frontend can be deployed on Vercel (`frontend/vercel.json` has SPA rewrite).
- Backend is designed to run continuously (PM2 recommended).
- Configure CORS correctly via `ALLOWED_ORIGINS`.
- Use a strong `JWT_SECRET`.
- Do not commit real `.env` credentials.
- Restrict external access to URBackup/MacStudio APIs.

---

## 12) Troubleshooting

## Backend fails at startup

- Ensure `DATABASE_URL` is valid and reachable.
- Ensure `JWT_SECRET` is set.

## Jobs do not execute

- Check `rclone version` in backend host shell.
- Verify remote names from `rclone listremotes` match job paths.
- Check run log files via UI Logs page and `/api/runs/:id/log`.

## URBackup data empty

- Verify `URBACKUP_URL` and credentials.
- Test URBackup UI access in browser.
- Check scheduler by manually calling `/api/urbackup/sync` as admin.

## Frontend cannot call backend

- In local dev: verify backend is on port 3001.
- In production: set `VITE_API_URL` to backend public API URL.
- Check CORS `ALLOWED_ORIGINS`.

---

## 13) What Is Included vs Not Included

Included:

- Full app source code (frontend + backend)
- PM2 config
- Environment templates
- URBackup Docker Compose template (`wamocon-backup-app/deploy/urbackup/docker-compose.yml`)

Not included directly as files in repo:

- rclone remote config file (`rclone.conf` stays on host machine)
- Managed PostgreSQL instance (must be provided externally)

---

If you want, the next step can be adding one single bootstrap script so a user can run one command and get both frontend and backend installed and started in local mode.
