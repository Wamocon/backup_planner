const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { requireAuth } = require('../../core/middleware/auth.middleware');
const { checkRcloneHealth } = require('../backup/rclone.service');
const urbackupSyncService = require('../urbackup/urbackup.sync.service');
const parser = require('cron-parser');

router.use(requireAuth);

router.get('/', async (req, res) => {
    try {
        const jobsCount = db.prepare('SELECT COUNT(*) as c FROM backup_jobs').get().c;
        const lastRuns = db.prepare('SELECT * FROM backup_runs ORDER BY started_at DESC LIMIT 5').all();

        // Let's grab upcoming jobs by checking scheduler next execution bounds if possible, 
        // but for now we'll just return active jobs as upcoming info isn't easily extracted from node-cron without extensions
        const activeJobsRaw = db.prepare('SELECT id, name, schedule, destination FROM backup_jobs WHERE is_active = 1').all();
        const activeJobs = activeJobsRaw.map(job => {
            try {
                const interval = parser.parseExpression(job.schedule);
                job.next_run = interval.next().toISOString();
            } catch (e) {
                job.next_run = null;
            }

            try {
                job.destination = JSON.parse(job.destination);
            } catch (e) {
                // If parsing fails or it's not a JSON array, make it an array.
                job.destination = [job.destination];
            }

            return job;
        });

        const health = await checkRcloneHealth();

        // URBackup Aggregat-Daten aus dem lokalen Cache
        const urbackupClientsTotal = db.prepare('SELECT COUNT(*) as c FROM urbackup_clients').get().c;
        const urbackupClientsOnline = db.prepare('SELECT COUNT(*) as c FROM urbackup_clients WHERE online = 1').get().c;
        const urbackupClientsFileOk = db.prepare('SELECT COUNT(*) as c FROM urbackup_clients WHERE file_ok = 1 AND file_disabled = 0').get().c;
        const urbackupClientsImageOk = db.prepare('SELECT COUNT(*) as c FROM urbackup_clients WHERE image_ok = 1 AND image_disabled = 0').get().c;
        const urbackupRecentBackups = db.prepare(`
            SELECT client_name, backup_type, backup_time, status
            FROM urbackup_backup_history
            ORDER BY backup_time DESC LIMIT 5
        `).all();
        const urbackupSyncStatus = urbackupSyncService.getSyncStatus();

        res.json({
            jobs_count: jobsCount,
            last_runs: lastRuns,
            upcoming: activeJobs,
            health: health,
            urbackup: {
                clients_total: urbackupClientsTotal,
                clients_online: urbackupClientsOnline,
                clients_file_ok: urbackupClientsFileOk,
                clients_image_ok: urbackupClientsImageOk,
                recent_backups: urbackupRecentBackups,
                sync: urbackupSyncStatus
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to load dashboard data', details: err.message });
    }
});

module.exports = router;
