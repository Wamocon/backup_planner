const cron = require('node-cron');
const pool = require('../../database/db');
const urbackupService = require('./urbackup.service');

const SYNC_SCHEDULE = process.env.URBACKUP_SYNC_SCHEDULE || '*/15 * * * *';

let syncTask = null;
let lastSyncAt = null;
let lastSyncError = null;

function toIso(ts) {
    if (!ts) return null;
    if (typeof ts === 'string' && ts.includes('-')) return ts;
    const n = Number(ts);
    if (!n || n <= 0) return null;
    return new Date(n * 1000).toISOString();
}

async function runSync() {
    console.log('[URBackup Sync] Starting synchronization...');
    try {
        const clients = await urbackupService.getStatus();

        if (!Array.isArray(clients)) {
            console.warn('[URBackup Sync] Unexpected response format from getStatus()');
            lastSyncError = 'Unerwartetes Antwortformat vom URBackup-Server';
            return;
        }

        const syncedAt = new Date().toISOString();

        for (const c of clients) {
            await pool.query(
                `INSERT INTO urbackup_clients (id, name, online, last_file_backup, last_image_backup,
                    file_ok, image_ok, file_disabled, image_disabled, client_version, synced_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                 ON CONFLICT(id) DO UPDATE SET
                    name              = EXCLUDED.name,
                    online            = EXCLUDED.online,
                    last_file_backup  = EXCLUDED.last_file_backup,
                    last_image_backup = EXCLUDED.last_image_backup,
                    file_ok           = EXCLUDED.file_ok,
                    image_ok          = EXCLUDED.image_ok,
                    file_disabled     = EXCLUDED.file_disabled,
                    image_disabled    = EXCLUDED.image_disabled,
                    client_version    = EXCLUDED.client_version,
                    synced_at         = EXCLUDED.synced_at`,
                [
                    c.id, c.name, c.online ? 1 : 0,
                    toIso(c.lastbackup), toIso(c.lastbackup_image),
                    c.file_ok ? 1 : 0, c.image_ok ? 1 : 0,
                    c.file_disabled ? 1 : 0, c.image_disabled ? 1 : 0,
                    c.client_version || null, syncedAt
                ]
            );

            try {
                const backupsData = await urbackupService.getClientBackups(c.id);

                for (const b of (backupsData?.file || [])) {
                    await pool.query(
                        `INSERT INTO urbackup_backup_history
                            (urbackup_id, client_id, client_name, backup_type, backup_time,
                             size_bytes, duration_sec, incremental, letter, status, synced_at)
                         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
                         ON CONFLICT (client_id, backup_type, backup_time) DO NOTHING`,
                        [
                            b.id || null, c.id, c.name, 'file', toIso(b.backuptime),
                            b.size_bytes || null, b.duration || null,
                            b.incremental ? 1 : 0, null,
                            b.complete ? 'ok' : 'partial', syncedAt
                        ]
                    );
                }

                for (const b of (backupsData?.image || [])) {
                    await pool.query(
                        `INSERT INTO urbackup_backup_history
                            (urbackup_id, client_id, client_name, backup_type, backup_time,
                             size_bytes, duration_sec, incremental, letter, status, synced_at)
                         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
                         ON CONFLICT (client_id, backup_type, backup_time) DO NOTHING`,
                        [
                            b.id || null, c.id, c.name, 'image', toIso(b.backuptime),
                            b.size_bytes || null, b.duration || null,
                            b.incremental ? 1 : 0, b.letter || null,
                            b.complete ? 'ok' : 'partial', syncedAt
                        ]
                    );
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
    runSync().catch(err => console.error('[URBackup Sync] Initial sync error:', err.message));
}

module.exports = {
    initializeSyncScheduler,
    getSyncStatus,
    runSync
};
