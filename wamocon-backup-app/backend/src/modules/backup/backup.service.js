const pool = require('../../database/db');
const scheduler = require('./scheduler.service');
const parser = require('cron-parser');

function attachNextRun(job) {
    if (job && job.is_active && job.schedule) {
        try {
            const interval = parser.parseExpression(job.schedule);
            job.next_run = interval.next().toISOString();
        } catch (e) {
            job.next_run = null;
        }
    }
    return job;
}

async function getAllJobs() {
    const { rows } = await pool.query('SELECT * FROM backup_jobs ORDER BY created_at DESC');
    return rows.map(attachNextRun);
}

async function getJobById(id) {
    const { rows } = await pool.query('SELECT * FROM backup_jobs WHERE id = $1', [id]);
    return attachNextRun(rows[0] || null);
}

// GoBD-Mindest-Aufbewahrung: 10 Jahre (3650 Tage)
const GOBD_MIN_RETENTION_DAYS = 3650;

async function createJob(jobData, userId) {
    const { name, source, destination, backup_type, schedule, retention_days, is_active } = jobData;

    const destStr = Array.isArray(destination) ? JSON.stringify(destination) : destination;

    let effectiveRetention = retention_days || 90;
    if (backup_type === 'gobd' && effectiveRetention < GOBD_MIN_RETENTION_DAYS) {
        effectiveRetention = GOBD_MIN_RETENTION_DAYS;
    }

    const { rows } = await pool.query(
        `INSERT INTO backup_jobs (name, source, destination, backup_type, schedule, retention_days, is_active, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
            name,
            source,
            destStr,
            backup_type || 'full',
            schedule,
            effectiveRetention,
            is_active === undefined ? 1 : is_active,
            userId
        ]
    );

    const newJob = await getJobById(rows[0].id);
    if (newJob.is_active) {
        scheduler.scheduleJob(newJob);
    }

    return newJob;
}

async function updateJob(id, jobData) {
    const { name, source, destination, backup_type, schedule, retention_days, is_active } = jobData;

    const { rows: existing } = await pool.query('SELECT backup_type FROM backup_jobs WHERE id = $1', [id]);
    if (existing[0] && existing[0].backup_type === 'gobd' && backup_type !== 'gobd') {
        throw new Error('GoBD-konforme Backup-Pläne dürfen aus Compliance-Gründen nicht in einen anderen Typ geändert werden.');
    }

    const destStr = Array.isArray(destination) ? JSON.stringify(destination) : destination;

    let effectiveRetention = retention_days;
    if (backup_type === 'gobd' && effectiveRetention < GOBD_MIN_RETENTION_DAYS) {
        effectiveRetention = GOBD_MIN_RETENTION_DAYS;
    }

    await pool.query(
        `UPDATE backup_jobs
         SET name = $1, source = $2, destination = $3, backup_type = $4, schedule = $5,
             retention_days = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP
         WHERE id = $8`,
        [name, source, destStr, backup_type, schedule, effectiveRetention, is_active === undefined ? 1 : is_active, id]
    );

    const updatedJob = await getJobById(id);

    if (updatedJob.is_active) {
        scheduler.scheduleJob(updatedJob);
    } else {
        scheduler.unscheduleJob(updatedJob.id);
    }

    return updatedJob;
}

async function deleteJob(id) {
    const { rows } = await pool.query('SELECT backup_type FROM backup_jobs WHERE id = $1', [id]);
    if (rows[0] && rows[0].backup_type === 'gobd') {
        throw new Error('GoBD-konforme Backup-Pläne dürfen aus Compliance-Gründen nicht gelöscht werden. Der Plan kann nur deaktiviert werden.');
    }

    const result = await pool.query('DELETE FROM backup_jobs WHERE id = $1', [id]);
    if (result.rowCount > 0) {
        scheduler.unscheduleJob(parseInt(id));
        return true;
    }
    return false;
}

module.exports = {
    getAllJobs,
    getJobById,
    createJob,
    updateJob,
    deleteJob
};
