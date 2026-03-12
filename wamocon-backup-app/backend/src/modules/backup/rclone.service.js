const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const db = require('../../database/db');
const emailService = require('../../core/email/email.service');

// Map of runId -> childProcess to keep track of running tasks for stopping
const runningProcesses = new Map();

async function runBackupJob(job, triggeredBy = 'schedule') {
    const rclonePath = process.env.RCLONE_PATH || 'rclone';
    const logDir = process.env.RCLONE_LOG_DIR || path.join(__dirname, '../../../../logs');

    // Ensure logs directory exists
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(logDir, `job_${job.id}_${timestamp}.log`);

    // Create a new run entry
    const insertRun = db.prepare(`
        INSERT INTO backup_runs (job_id, started_at, status, log_file_path, triggered_by)
        VALUES (?, CURRENT_TIMESTAMP, 'running', ?, ?)
    `);
    const runId = insertRun.run(job.id, logFile, triggeredBy).lastInsertRowid;

    // Build rclone args
    // Simplified args: rclone copy SOURCE DEST --progress --stats 10s --log-file LOGFILE
    let dests = [];
    try {
        dests = JSON.parse(job.destination);
        if (!Array.isArray(dests)) dests = [job.destination];
    } catch {
        dests = [job.destination];
    }

    // For simplicity MVP we will loop dests sequentially if multiple, or spawn multiple.
    // Let's spawn sequentially for now. We wrap it in an async IIFE to not block returning the runId immediately.
    (async () => {
        let finalExitCode = 0;
        let errorMessage = null;

        for (const dest of dests) {
            if (finalExitCode !== 0) break; // stop if one fails

            await new Promise((resolve) => {
                const args = ['copy', job.source, dest, '--progress', '--transfers=4', `--log-file=${logFile}`, '--log-level', 'INFO', '--stats', '60s'];

                if (job.backup_type === 'incremental' || job.backup_type === 'differential') {
                    args.push('--update');
                }

                // GoBD: Vollständige Kopie + Checksummen-Prüfung für Datenintegrität
                if (job.backup_type === 'gobd') {
                    args.push('--checksum');
                }

                const rcloneProcess = spawn(rclonePath, args);

                runningProcesses.set(runId, rcloneProcess);

                rcloneProcess.on('close', (code) => {
                    if (code !== 0) {
                        finalExitCode = code;
                        errorMessage = `Process exited with code ${code}`;
                    }
                    resolve();
                });

                rcloneProcess.on('error', (err) => {
                    finalExitCode = 1;
                    errorMessage = err.message;
                    resolve();
                });
            });
        }

        runningProcesses.delete(runId);

        const status = finalExitCode === 0 ? 'success' : 'failed';

        db.prepare(`
            UPDATE backup_runs 
            SET status = ?, finished_at = CURRENT_TIMESTAMP, exit_code = ?, error_message = ?
            WHERE id = ?
        `).run(status, finalExitCode, errorMessage, runId);

        const currentRun = db.prepare('SELECT * FROM backup_runs WHERE id = ?').get(runId);
        if (status === 'success') {
            emailService.sendSuccessNotification(job, currentRun);
        } else {
            emailService.sendFailureNotification(job, currentRun, errorMessage);
        }
    })();

    return runId;
}

async function stopBackupJob(runId) {
    const process = runningProcesses.get(runId);
    if (process) {
        process.kill('SIGTERM');
        runningProcesses.delete(runId);

        db.prepare(`
            UPDATE backup_runs 
            SET status = 'stopped', finished_at = CURRENT_TIMESTAMP, error_message = 'Stopped manually'
            WHERE id = ?
        `).run(runId);

        return true;
    }
    return false;
}

function checkRcloneHealth() {
    return new Promise((resolve) => {
        const rclonePath = process.env.RCLONE_PATH || 'rclone';
        const proc = spawn(rclonePath, ['version']);

        let output = '';
        proc.stdout.on('data', (data) => output += data.toString());

        proc.on('close', (code) => {
            if (code === 0) {
                resolve({ status: 'ok', version: output.split('\n')[0] });
            } else {
                resolve({ status: 'error', error: 'rclone not found' });
            }
        });

        proc.on('error', (err) => {
            resolve({ status: 'error', error: err.message });
        });
    });
}

module.exports = {
    runBackupJob,
    stopBackupJob,
    checkRcloneHealth
};
