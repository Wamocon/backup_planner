const cron = require('node-cron');
const db = require('../../database/db');
const urbackupService = require('./urbackup.service');

// Alle 15 Minuten synchronisieren
const SYNC_SCHEDULE = process.env.URBACKUP_SYNC_SCHEDULE || '*/15 * * * *';

let syncTask = null;
let lastSyncAt = null;
let lastSyncError = null;

/**
 * Helper: Unix-Timestamp (Sekunden) in ISO-String für SQLite
 */
function toIso(ts) {
    if (!ts) return null;
    if (typeof ts === 'string' && ts.includes('-')) return ts; // already ISO
    const n = Number(ts);
    if (!n || n <= 0) return null;
    return new Date(n * 1000).toISOString();
}

/**
 * Hauptsynchronisierung: Clients + Backup-History vom URBackup-Server in SQLite cachen
 */
async function runSync() {
    console.log('[URBackup Sync] Starting synchronization...');
    try {
        const clients = await urbackupService.getStatus();

        if (!Array.isArray(clients)) {
            console.warn('[URBackup Sync] Unexpected response format from getStatus()');
            lastSyncError = 'Unerwartetes Antwortformat vom URBackup-Server';
            return;
        }

        const upsertClient = db.prepare(`
            INSERT INTO urbackup_clients (id, name, online, last_file_backup, last_image_backup,
                file_ok, image_ok, file_disabled, image_disabled, client_version, synced_at)
            VALUES (@id, @name, @online, @last_file_backup, @last_image_backup,
                @file_ok, @image_ok, @file_disabled, @image_disabled, @client_version, @synced_at)
            ON CONFLICT(id) DO UPDATE SET
                name            = excluded.name,
                online          = excluded.online,
                last_file_backup  = excluded.last_file_backup,
                last_image_backup = excluded.last_image_backup,
                file_ok         = excluded.file_ok,
                image_ok        = excluded.image_ok,
                file_disabled   = excluded.file_disabled,
                image_disabled  = excluded.image_disabled,
                client_version  = excluded.client_version,
                synced_at       = excluded.synced_at
        `);

        const insertHistory = db.prepare(`
            INSERT OR IGNORE INTO urbackup_backup_history
                (urbackup_id, client_id, client_name, backup_type, backup_time,
                 size_bytes, duration_sec, incremental, letter, status, synced_at)
            VALUES
                (@urbackup_id, @client_id, @client_name, @backup_type, @backup_time,
                 @size_bytes, @duration_sec, @incremental, @letter, @status, @synced_at)
        `);

        const syncedAt = new Date().toISOString();

        for (const c of clients) {
            upsertClient.run({
                id: c.id,
                name: c.name,
                online: c.online ? 1 : 0,
                last_file_backup: toIso(c.lastbackup),
                last_image_backup: toIso(c.lastbackup_image),
                file_ok: c.file_ok ? 1 : 0,
                image_ok: c.image_ok ? 1 : 0,
                file_disabled: c.file_disabled ? 1 : 0,
                image_disabled: c.image_disabled ? 1 : 0,
                client_version: c.client_version || null,
                synced_at: syncedAt
            });

            try {
                const backupsData = await urbackupService.getClientBackups(c.id);

                const fileBackups = backupsData?.file || [];
                for (const b of fileBackups) {
                    insertHistory.run({
                        urbackup_id: b.id || null,
                        client_id: c.id,
                        client_name: c.name,
                        backup_type: 'file',
                        backup_time: toIso(b.backuptime),
                        size_bytes: b.size_bytes || null,
                        duration_sec: b.duration || null,
                        incremental: b.incremental ? 1 : 0,
                        letter: null,
                        status: b.complete ? 'ok' : 'partial',
                        synced_at: syncedAt
                    });
                }

                const imageBackups = backupsData?.image || [];
                for (const b of imageBackups) {
                    insertHistory.run({
                        urbackup_id: b.id || null,
                        client_id: c.id,
                        client_name: c.name,
                        backup_type: 'image',
                        backup_time: toIso(b.backuptime),
                        size_bytes: b.size_bytes || null,
                        duration_sec: b.duration || null,
                        incremental: b.incremental ? 1 : 0,
                        letter: b.letter || null,
                        status: b.complete ? 'ok' : 'partial',
                        synced_at: syncedAt
                    });
                }
            } catch (histErr) {
                console.warn(`[URBackup Sync] Could not fetch backup history for client "${c.name}":`, histErr.message);
            }
        }

        lastSyncAt = syncedAt;
        lastSyncError = null;
        console.log(`[URBackup Sync] Done. Synced ${clients.length} client(s).`);
    } catch (err) {
        lastSyncError = err.message;
        console.error('[URBackup Sync] Synchronization failed:', err.message);
    }
}

function getSyncStatus() {
    return {
        last_sync_at: lastSyncAt,
        last_sync_error: lastSyncError,
        schedule: SYNC_SCHEDULE
    };
}

function initializeSyncScheduler() {
    if (syncTask) {
        syncTask.stop();
    }

    syncTask = cron.schedule(SYNC_SCHEDULE, () => {
        runSync();
    }, {
        scheduled: true,
        timezone: 'Europe/Berlin'
    });

    console.log(`[URBackup Sync] Scheduler initialized (${SYNC_SCHEDULE}). Running initial sync...`);
    // Sofortiger erster Sync beim Start (nicht blockierend)
    runSync().catch(err => console.error('[URBackup Sync] Initial sync error:', err.message));
}

module.exports = {
    initializeSyncScheduler,
    getSyncStatus,
    runSync
};
