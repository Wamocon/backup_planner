const db = require('../../database/db');
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

function getAllJobs() {
    const jobs = db.prepare('SELECT * FROM backup_jobs ORDER BY created_at DESC').all();
    return jobs.map(attachNextRun);
}

function getJobById(id) {
    const job = db.prepare('SELECT * FROM backup_jobs WHERE id = ?').get(id);
    return attachNextRun(job);
}

function createJob(jobData, userId) {
    const { name, source, destination, backup_type, schedule, retention_days, is_active } = jobData;

    // Store array destination as JSON string if it's an array
    const destStr = Array.isArray(destination) ? JSON.stringify(destination) : destination;

    const stmt = db.prepare(`
        INSERT INTO backup_jobs (name, source, destination, backup_type, schedule, retention_days, is_active, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
        name,
        source,
        destStr,
        backup_type || 'full',
        schedule,
        retention_days || 90,
        is_active === undefined ? 1 : is_active,
        userId
    );

    const newJob = getJobById(result.lastInsertRowid);
    if (newJob.is_active) {
        scheduler.scheduleJob(newJob);
    }

    return newJob;
}

function updateJob(id, jobData) {
    const { name, source, destination, backup_type, schedule, retention_days, is_active } = jobData;

    const destStr = Array.isArray(destination) ? JSON.stringify(destination) : destination;

    const stmt = db.prepare(`
        UPDATE backup_jobs 
        SET name = ?, source = ?, destination = ?, backup_type = ?, schedule = ?, retention_days = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);

    stmt.run(
        name,
        source,
        destStr,
        backup_type,
        schedule,
        retention_days,
        is_active === undefined ? 1 : is_active,
        id
    );

    const updatedJob = getJobById(id);

    if (updatedJob.is_active) {
        scheduler.scheduleJob(updatedJob);
    } else {
        scheduler.unscheduleJob(updatedJob.id);
    }

    return updatedJob;
}

function deleteJob(id) {
    // We do NOT delete from backup_runs so history remains intact per requirements!
    // db.prepare('DELETE FROM backup_runs WHERE job_id = ?').run(id); 
    const result = db.prepare('DELETE FROM backup_jobs WHERE id = ?').run(id);
    if (result.changes > 0) {
        scheduler.unscheduleJob(id);
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
