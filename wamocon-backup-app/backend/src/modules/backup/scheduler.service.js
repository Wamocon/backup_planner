const cron = require('node-cron');
const pool = require('../../database/db');
const rcloneService = require('./rclone.service');

const scheduledJobs = new Map(); // job_id -> cron instance

function scheduleJob(job) {
    if (!job.schedule || job.is_active !== 1) return;

    if (scheduledJobs.has(job.id)) {
        const prevCron = scheduledJobs.get(job.id);
        prevCron.stop();
        scheduledJobs.delete(job.id);
    }

    try {
        const task = cron.schedule(job.schedule, async () => {
            console.log(`[Cron] Triggering scheduled job execution: ${job.name} (ID: ${job.id})`);
            await rcloneService.runBackupJob(job, 'schedule');
        }, {
            scheduled: true,
            timezone: "Europe/Berlin"
        });

        scheduledJobs.set(job.id, task);
        console.log(`[Cron] Scheduled job: ${job.name} (${job.schedule})`);
    } catch (err) {
        console.error(`[Cron] Error scheduling job ${job.id}:`, err.message);
    }
}

function unscheduleJob(jobId) {
    if (scheduledJobs.has(jobId)) {
        scheduledJobs.get(jobId).stop();
        scheduledJobs.delete(jobId);
        console.log(`[Cron] Unscheduled job ID: ${jobId}`);
    }
}

async function initializeScheduler() {
    for (const [, task] of scheduledJobs.entries()) {
        task.stop();
    }
    scheduledJobs.clear();

    const { rows: activeJobs } = await pool.query('SELECT * FROM backup_jobs WHERE is_active = 1');
    console.log(`[Cron] Initializing ${activeJobs.length} active jobs...`);
    activeJobs.forEach(job => scheduleJob(job));
}

module.exports = {
    scheduleJob,
    unscheduleJob,
    initializeScheduler
};

