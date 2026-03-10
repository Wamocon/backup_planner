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
