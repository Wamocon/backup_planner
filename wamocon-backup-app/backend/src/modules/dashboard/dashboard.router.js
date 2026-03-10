const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { requireAuth } = require('../../core/middleware/auth.middleware');
const { checkRcloneHealth } = require('../backup/rclone.service');
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

        res.json({
            jobs_count: jobsCount,
            last_runs: lastRuns,
            upcoming: activeJobs,
            health: health
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to load dashboard data', details: err.message });
    }
});

module.exports = router;
