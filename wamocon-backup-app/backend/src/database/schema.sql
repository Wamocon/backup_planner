-- schema.sql (PostgreSQL / Supabase)

-- Benutzer
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'guest')),
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Backup-Jobs
CREATE TABLE IF NOT EXISTS backup_jobs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL,
  destination TEXT NOT NULL,
  backup_type TEXT NOT NULL CHECK(backup_type IN ('full', 'incremental', 'differential', 'gobd')),
  schedule TEXT NOT NULL,
  retention_days INTEGER DEFAULT 90,
  is_active INTEGER DEFAULT 1,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Backup-Ausführungen (History)
CREATE TABLE IF NOT EXISTS backup_runs (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES backup_jobs(id),
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  status TEXT CHECK(status IN ('running', 'success', 'failed', 'stopped')),
  exit_code INTEGER,
  error_message TEXT,
  log_file_path TEXT,
  bytes_transferred BIGINT,
  files_transferred INTEGER,
  triggered_by TEXT DEFAULT 'schedule'
);

-- System-Konfiguration (Key-Value)
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- URBackup: Gecachte Client-Liste
CREATE TABLE IF NOT EXISTS urbackup_clients (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  online INTEGER DEFAULT 0,
  last_file_backup TIMESTAMPTZ,
  last_image_backup TIMESTAMPTZ,
  file_ok INTEGER DEFAULT 0,
  image_ok INTEGER DEFAULT 0,
  file_disabled INTEGER DEFAULT 0,
  image_disabled INTEGER DEFAULT 0,
  client_version TEXT,
  synced_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- URBackup: Gerätezuordnung
CREATE TABLE IF NOT EXISTS device_owners (
  id SERIAL PRIMARY KEY,
  urbackup_client_id INTEGER NOT NULL REFERENCES urbackup_clients(id) ON DELETE CASCADE,
  display_name TEXT,
  owner_name TEXT,
  department TEXT,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(urbackup_client_id)
);

-- URBackup: Gecachte Backup-History
CREATE TABLE IF NOT EXISTS urbackup_backup_history (
  id SERIAL PRIMARY KEY,
  urbackup_id INTEGER,
  client_id INTEGER NOT NULL,
  client_name TEXT NOT NULL,
  backup_type TEXT NOT NULL,
  backup_time TIMESTAMPTZ NOT NULL,
  size_bytes BIGINT,
  duration_sec INTEGER,
  incremental INTEGER DEFAULT 0,
  letter TEXT,
  status TEXT DEFAULT 'ok',
  synced_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Deduplizierungs-Index für URBackup History Sync
CREATE UNIQUE INDEX IF NOT EXISTS urbackup_history_unique
  ON urbackup_backup_history (client_id, backup_type, backup_time);

