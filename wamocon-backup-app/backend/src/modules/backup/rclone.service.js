const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const pool = require('../../database/db');
const emailService = require('../../core/email/email.service');

// Map of runId -> childProcess to keep track of running tasks for stopping
const runningProcesses = new Map();

async function runBackupJob(job, triggeredBy = 'schedule') {
    const rclonePath = process.env.RCLONE_PATH || 'rclone';
    const logDir = process.env.RCLONE_LOG_DIR || path.join(__dirname, '../../../../logs');

    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(logDir, `job_${job.id}_${timestamp}.log`);

    const { rows } = await pool.query(
        `INSERT INTO backup_runs (job_id, started_at, status, log_file_path, triggered_by)
         VALUES ($1, CURRENT_TIMESTAMP, 'running', $2, $3) RETURNING id`,
        [job.id, logFile, triggeredBy]
    );
    const runId = rows[0].id;

    let dests = [];
    try {
        dests = JSON.parse(job.destination);
        if (!Array.isArray(dests)) dests = [job.destination];
    } catch {
        dests = [job.destination];
    }

    (async () => {
        let finalExitCode = 0;
        let errorMessage = null;

        for (const dest of dests) {
            if (finalExitCode !== 0) break;

            await new Promise((resolve) => {
                const args = ['copy', job.source, dest, '--progress', '--transfers=4', `--log-file=${logFile}`, '--log-level', 'INFO', '--stats', '60s'];

                if (job.backup_type === 'incremental' || job.backup_type === 'differential') {
                    args.push('--update');
                }
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

        await pool.query(
            `UPDATE backup_runs SET status = $1, finished_at = CURRENT_TIMESTAMP, exit_code = $2, error_message = $3 WHERE id = $4`,
            [status, finalExitCode, errorMessage, runId]
        );

        const { rows: runRows } = await pool.query('SELECT * FROM backup_runs WHERE id = $1', [runId]);
        const currentRun = runRows[0];
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

        await pool.query(
            `UPDATE backup_runs SET status = 'stopped', finished_at = CURRENT_TIMESTAMP, error_message = 'Stopped manually' WHERE id = $1`,
            [runId]
        );

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

