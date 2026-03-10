const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const fs = require('fs');
const { requireAuth } = require('../../core/middleware/auth.middleware');

router.use(requireAuth);

router.get('/', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const jobId = req.query.job_id;

    let query = 'SELECT * FROM backup_runs';
    const params = [];

    if (jobId) {
        query += ' WHERE job_id = ?';
        params.push(jobId);
    }

    query += ' ORDER BY started_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const runs = db.prepare(query).all(...params);
    res.json(runs);
});

router.get('/recent', (req, res) => {
    const days = parseInt(req.query.days) || 7;
    // SQLite syntax for days subtraction
    const runs = db.prepare(`
        SELECT r.*, j.name as job_name 
        FROM backup_runs r
        LEFT JOIN backup_jobs j ON r.job_id = j.id
        WHERE r.started_at >= date('now', '-' || ? || ' days')
        ORDER BY r.started_at ASC
    `).all(days);

    res.json(runs);
});

router.get('/:id', (req, res) => {
    const run = db.prepare('SELECT * FROM backup_runs WHERE id = ?').get(req.params.id);
    if (!run) return res.status(404).json({ error: 'Run not found' });
    res.json(run);
});

router.get('/:id/log', (req, res) => {
    const run = db.prepare('SELECT log_file_path FROM backup_runs WHERE id = ?').get(req.params.id);
    if (!run) return res.status(404).json({ error: 'Run not found' });

    if (!run.log_file_path || !fs.existsSync(run.log_file_path)) {
        return res.json({ content: 'No log file found.' });
    }

    const content = fs.readFileSync(run.log_file_path, 'utf-8');
    res.json({ content });
});

module.exports = router;
