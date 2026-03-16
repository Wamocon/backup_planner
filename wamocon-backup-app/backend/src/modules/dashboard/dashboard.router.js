const express = require('express');
const router = express.Router();
const pool = require('../../database/db');
const { requireAuth } = require('../../core/middleware/auth.middleware');
const { checkRcloneHealth } = require('../backup/rclone.service');
const urbackupSyncService = require('../urbackup/urbackup.sync.service');
const parser = require('cron-parser');

router.use(requireAuth);

router.get('/', async (req, res) => {
    try {
        const [jobsResult, lastRunsResult, activeJobsResult, urTotalResult, urOnlineResult, urFileOkResult, urImageOkResult, urHistoryResult] = await Promise.all([
            pool.query('SELECT COUNT(*) as c FROM backup_jobs'),
            pool.query('SELECT * FROM backup_runs ORDER BY started_at DESC LIMIT 5'),
            pool.query('SELECT id, name, schedule, destination FROM backup_jobs WHERE is_active = 1'),
            pool.query('SELECT COUNT(*) as c FROM urbackup_clients'),
            pool.query('SELECT COUNT(*) as c FROM urbackup_clients WHERE online = 1'),
            pool.query('SELECT COUNT(*) as c FROM urbackup_clients WHERE file_ok = 1 AND file_disabled = 0'),
            pool.query('SELECT COUNT(*) as c FROM urbackup_clients WHERE image_ok = 1 AND image_disabled = 0'),
            pool.query('SELECT client_name, backup_type, backup_time, status FROM urbackup_backup_history ORDER BY backup_time DESC LIMIT 5')
        ]);

        const activeJobs = activeJobsResult.rows.map(job => {
            try {
                const interval = parser.parseExpression(job.schedule);
                job.next_run = interval.next().toISOString();
            } catch (e) {
                job.next_run = null;
            }
            try {
                job.destination = JSON.parse(job.destination);
            } catch (e) {
                job.destination = [job.destination];
            }
            return job;
        });

        const health = await checkRcloneHealth();
        const urbackupSyncStatus = urbackupSyncService.getSyncStatus();

        res.json({
            jobs_count: parseInt(jobsResult.rows[0].c),
            last_runs: lastRunsResult.rows,
            upcoming: activeJobs,
            health: health,
            urbackup: {
                clients_total: parseInt(urTotalResult.rows[0].c),
                clients_online: parseInt(urOnlineResult.rows[0].c),
                clients_file_ok: parseInt(urFileOkResult.rows[0].c),
                clients_image_ok: parseInt(urImageOkResult.rows[0].c),
                recent_backups: urHistoryResult.rows,
                sync: urbackupSyncStatus
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to load dashboard data', details: err.message });
    }
});

module.exports = router;
