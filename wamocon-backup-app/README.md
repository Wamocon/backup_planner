# WAMOCON Backup Planner (App Folder)

The full, up-to-date project documentation is now in the repository root README:

- `../README.md`

That document includes:

- complete architecture and module breakdown
- all setup commands
- environment variable reference
- Docker-based URBackup workflow
- API endpoint overview
- local and PM2 production run instructions

## Quick local run

```bash
# terminal 1
cd backend
cp .env.example .env
npm install
npm run dev
```

```bash
# terminal 2
cd frontend
npm install
npm run dev
```

Backend default URL: `http://localhost:3001`

Frontend default URL: `http://localhost:5173`
