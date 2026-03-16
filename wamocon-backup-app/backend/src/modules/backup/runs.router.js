const express = require('express');
const router = express.Router();
const pool = require('../../database/db');
const fs = require('fs');
const { requireAuth } = require('../../core/middleware/auth.middleware');

router.use(requireAuth);

router.get('/', async (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const jobId = req.query.job_id ? parseInt(req.query.job_id) : null;

    let query;
    let params;

    if (jobId) {
        query = 'SELECT * FROM backup_runs WHERE job_id = $1 ORDER BY started_at DESC LIMIT $2 OFFSET $3';
        params = [jobId, limit, offset];
    } else {
        query = 'SELECT * FROM backup_runs ORDER BY started_at DESC LIMIT $1 OFFSET $2';
        params = [limit, offset];
    }

    const { rows } = await pool.query(query, params);
    res.json(rows);
});

router.get('/recent', async (req, res) => {
    const days = parseInt(req.query.days) || 7;
    const { rows } = await pool.query(`
        SELECT r.*, j.name as job_name
        FROM backup_runs r
        LEFT JOIN backup_jobs j ON r.job_id = j.id
        WHERE r.started_at >= NOW() - ($1 || ' days')::INTERVAL
        ORDER BY r.started_at ASC
    `, [days]);
    res.json(rows);
});

router.get('/:id', async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM backup_runs WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Run not found' });
    res.json(rows[0]);
});

router.get('/:id/log', async (req, res) => {
    const { rows } = await pool.query('SELECT log_file_path FROM backup_runs WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Run not found' });

    if (!rows[0].log_file_path || !fs.existsSync(rows[0].log_file_path)) {
        return res.json({ content: 'No log file found.' });
    }

    const content = fs.readFileSync(rows[0].log_file_path, 'utf-8');
    res.json({ content });
});

module.exports = router;
