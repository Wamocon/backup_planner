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
  backup_type TEXT NOT NULL CHECK(backup_type IN ('full', 'incremental', 'differential', 'gobd')),
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

-- URBackup: Gecachte Client-Liste (periodisch synchronisiert)
CREATE TABLE IF NOT EXISTS urbackup_clients (
  id INTEGER PRIMARY KEY,        -- URBackup Client-ID (aus der Server-API)
  name TEXT NOT NULL,
  online INTEGER DEFAULT 0,
  last_file_backup DATETIME,
  last_image_backup DATETIME,
  file_ok INTEGER DEFAULT 0,
  image_ok INTEGER DEFAULT 0,
  file_disabled INTEGER DEFAULT 0,
  image_disabled INTEGER DEFAULT 0,
  client_version TEXT,
  synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- URBackup: Gerätezuordnung (Personen / Abteilung / Standort)
CREATE TABLE IF NOT EXISTS device_owners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  urbackup_client_id INTEGER NOT NULL REFERENCES urbackup_clients(id) ON DELETE CASCADE,
  display_name TEXT,             -- Anzeigename des Geräts (z.B. "Laptop Erwin")
  owner_name TEXT,               -- Verantwortliche Person
  department TEXT,               -- Abteilung / Team
  location TEXT,                 -- Raum / Standort
  notes TEXT,                    -- Freitext-Notizen
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(urbackup_client_id)
);

-- URBackup: Gecachte Backup-History (periodisch synchronisiert)
CREATE TABLE IF NOT EXISTS urbackup_backup_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  urbackup_id INTEGER,           -- ID vom URBackup-Server (falls vorhanden)
  client_id INTEGER NOT NULL,
  client_name TEXT NOT NULL,
  backup_type TEXT NOT NULL,     -- 'file' oder 'image'
  backup_time DATETIME NOT NULL,
  size_bytes INTEGER,
  duration_sec INTEGER,
  incremental INTEGER DEFAULT 0,
  letter TEXT,                   -- Laufwerksbuchstabe bei Image-Backups
  status TEXT DEFAULT 'ok',      -- 'ok', 'failed', 'partial'
  synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
