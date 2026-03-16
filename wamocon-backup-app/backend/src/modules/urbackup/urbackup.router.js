const express = require('express');
const router = express.Router();
const urbackupService = require('./urbackup.service');
const urbackupSyncService = require('./urbackup.sync.service');
const pool = require('../../database/db');
const { requireAuth } = require('../../core/middleware/auth.middleware');
const { requireAdmin } = require('../../core/middleware/role.middleware');

router.use(requireAuth);

// GET /api/urbackup/status — Live-Abfrage direkt vom URBackup-Server (Legacy)
router.get('/status', async (req, res) => {
    try {
        const status = await urbackupService.getStatus();
        res.json(status);
    } catch (error) {
        res.status(502).json({
            error: 'Bad Gateway',
            message: 'Could not fetch status from UrBackup server. Check connection settings in .env.'
        });
    }
});

// GET /api/urbackup/clients — Gecachte Client-Liste aus DB
router.get('/clients', async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM urbackup_clients ORDER BY name ASC');
    const syncStatus = urbackupSyncService.getSyncStatus();
    res.json({ clients: rows, sync: syncStatus });
});

// GET /api/urbackup/history — Gecachte Backup-History
router.get('/history', async (req, res) => {
    const days = parseInt(req.query.days) || 30;
    const clientId = req.query.client_id ? parseInt(req.query.client_id) : null;
    const type = req.query.type || null;

    const params = [days];
    let query = `SELECT * FROM urbackup_backup_history WHERE backup_time >= NOW() - ($1 || ' days')::INTERVAL`;

    if (clientId) {
        params.push(clientId);
        query += ` AND client_id = $${params.length}`;
    }
    if (type) {
        params.push(type);
        query += ` AND backup_type = $${params.length}`;
    }
    query += ' ORDER BY backup_time DESC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
});

// GET /api/urbackup/stats — Aggregierte Statistiken für das Dashboard
router.get('/stats', async (req, res) => {
    const [totalR, onlineR, fileOkR, imageOkR, historyR] = await Promise.all([
        pool.query('SELECT COUNT(*) as c FROM urbackup_clients'),
        pool.query('SELECT COUNT(*) as c FROM urbackup_clients WHERE online = 1'),
        pool.query('SELECT COUNT(*) as c FROM urbackup_clients WHERE file_ok = 1 AND file_disabled = 0'),
        pool.query('SELECT COUNT(*) as c FROM urbackup_clients WHERE image_ok = 1 AND image_disabled = 0'),
        pool.query('SELECT * FROM urbackup_backup_history ORDER BY backup_time DESC LIMIT 10')
    ]);

    res.json({
        clients_total: parseInt(totalR.rows[0].c),
        clients_online: parseInt(onlineR.rows[0].c),
        clients_file_ok: parseInt(fileOkR.rows[0].c),
        clients_image_ok: parseInt(imageOkR.rows[0].c),
        recent_backups: historyR.rows,
        sync: urbackupSyncService.getSyncStatus()
    });
});

// GET /api/urbackup/calendar?days=90 — History als Kalender-Events
router.get('/calendar', async (req, res) => {
    const days = parseInt(req.query.days) || 90;
    const { rows } = await pool.query(`
        SELECT id, client_id, client_name, backup_type, backup_time,
               size_bytes, duration_sec, incremental, letter, status
        FROM urbackup_backup_history
        WHERE backup_time >= NOW() - ($1 || ' days')::INTERVAL
        ORDER BY backup_time ASC
    `, [days]);
    res.json(rows);
});

// POST /api/urbackup/start — Backup-Job triggern (nur Admins)
router.post('/start', requireAdmin, async (req, res) => {
    const { clientId, backupType } = req.body;

    if (typeof clientId !== 'number' || !['full_file', 'incr_file', 'full_image', 'incr_image'].includes(backupType)) {
        return res.status(400).json({ error: 'clientId (number) and valid backupType required.' });
    }

    try {
        const result = await urbackupService.startBackup(clientId, backupType);
        res.json(result);
    } catch (err) {
        console.error('[URBackup Start] Error:', err.message);
        res.status(502).json({ error: 'Could not start backup.', details: err.message });
    }
});

// GET /api/urbackup/live — Live-Status + aktive Aktivitäten (kein Cache)
router.get('/live', async (req, res) => {
    try {
        const [status, activities] = await Promise.all([
            urbackupService.getStatus(),
            urbackupService.getActivities()
        ]);
        res.json({ status, activities });
    } catch (err) {
        res.status(502).json({ error: 'Could not fetch live data from URBackup.', details: err.message });
    }
});

// POST /api/urbackup/sync — Manuellen Sync auslösen (nur Admins)
router.post('/sync', requireAdmin, async (req, res) => {
    try {
        urbackupSyncService.runSync().catch(err =>
            console.error('[URBackup Sync] Manual sync error:', err.message)
        );
        res.json({ message: 'Sync wurde gestartet.' });
    } catch (err) {
        res.status(500).json({ error: 'Sync konnte nicht gestartet werden.', details: err.message });
    }
});

module.exports = router;


router.use(requireAuth);

// GET /api/urbackup/status — Live-Abfrage direkt vom URBackup-Server (Legacy)
router.get('/status', async (req, res) => {
    try {
        const status = await urbackupService.getStatus();
        res.json(status);
    } catch (error) {
        res.status(502).json({
            error: 'Bad Gateway',
            message: 'Could not fetch status from UrBackup server. Check connection settings in .env.'
        });
    }
});

// GET /api/urbackup/clients — Gecachte Client-Liste aus SQLite
router.get('/clients', (req, res) => {
    const clients = db.prepare('SELECT * FROM urbackup_clients ORDER BY name ASC').all();
    // Hänge die letzte Sync-Info an
    const syncStatus = urbackupSyncService.getSyncStatus();
    res.json({ clients, sync: syncStatus });
});

// GET /api/urbackup/history — Gecachte Backup-History aus SQLite
router.get('/history', (req, res) => {
    const days = parseInt(req.query.days) || 30;
    const clientId = req.query.client_id ? parseInt(req.query.client_id) : null;
    const type = req.query.type || null; // 'file' | 'image' | null = all

    let query = `
        SELECT * FROM urbackup_backup_history
        WHERE backup_time >= datetime('now', ?)
    `;
    const params = [`-${days} days`];

    if (clientId) {
        query += ' AND client_id = ?';
        params.push(clientId);
    }
    if (type) {
        query += ' AND backup_type = ?';
        params.push(type);
    }

    query += ' ORDER BY backup_time DESC';

    const history = db.prepare(query).all(...params);
    res.json(history);
});

// GET /api/urbackup/stats — Aggregierte Statistiken für das Dashboard
router.get('/stats', (req, res) => {
    const clientsTotal = db.prepare('SELECT COUNT(*) as c FROM urbackup_clients').get().c;
    const clientsOnline = db.prepare('SELECT COUNT(*) as c FROM urbackup_clients WHERE online = 1').get().c;
    const clientsFileOk = db.prepare('SELECT COUNT(*) as c FROM urbackup_clients WHERE file_ok = 1 AND file_disabled = 0').get().c;
    const clientsImageOk = db.prepare('SELECT COUNT(*) as c FROM urbackup_clients WHERE image_ok = 1 AND image_disabled = 0').get().c;

    const recentHistory = db.prepare(`
        SELECT * FROM urbackup_backup_history
        ORDER BY backup_time DESC LIMIT 10
    `).all();

    const syncStatus = urbackupSyncService.getSyncStatus();

    res.json({
        clients_total: clientsTotal,
        clients_online: clientsOnline,
        clients_file_ok: clientsFileOk,
        clients_image_ok: clientsImageOk,
        recent_backups: recentHistory,
        sync: syncStatus
    });
});

// GET /api/urbackup/calendar?days=90 — History als Kalender-Events
router.get('/calendar', (req, res) => {
    const days = parseInt(req.query.days) || 90;

    const events = db.prepare(`
        SELECT
            id,
            client_id,
            client_name,
            backup_type,
            backup_time,
            size_bytes,
            duration_sec,
            incremental,
            letter,
            status
        FROM urbackup_backup_history
        WHERE backup_time >= datetime('now', ?)
        ORDER BY backup_time ASC
    `).all(`-${days} days`);

    res.json(events);
});

// POST /api/urbackup/start — Backup-Job triggern (nur Admins)
// Body: { clientId: number, backupType: 'full_file' | 'incr_file' | 'full_image' | 'incr_image' }
router.post('/start', requireAdmin, async (req, res) => {
    const { clientId, backupType } = req.body;

    if (typeof clientId !== 'number' || !['full_file', 'incr_file', 'full_image', 'incr_image'].includes(backupType)) {
        return res.status(400).json({ error: 'clientId (number) and valid backupType required.' });
    }

    try {
        const result = await urbackupService.startBackup(clientId, backupType);
        res.json(result);
    } catch (err) {
        console.error('[URBackup Start] Error:', err.message);
        res.status(502).json({ error: 'Could not start backup.', details: err.message });
    }
});

// GET /api/urbackup/live — Live-Status + aktive Aktivitäten (kein Cache)
router.get('/live', async (req, res) => {
    try {
        const [status, activities] = await Promise.all([
            urbackupService.getStatus(),
            urbackupService.getActivities()
        ]);
        res.json({ status, activities });
    } catch (err) {
        res.status(502).json({ error: 'Could not fetch live data from URBackup.', details: err.message });
    }
});

// POST /api/urbackup/sync — Manuellen Sync auslösen (nur Admins)
router.post('/sync', requireAdmin, async (req, res) => {
    try {
        // Nicht-blockierend starten
        urbackupSyncService.runSync().catch(err =>
            console.error('[URBackup Sync] Manual sync error:', err.message)
        );
        res.json({ message: 'Sync wurde gestartet.' });
    } catch (err) {
        res.status(500).json({ error: 'Sync konnte nicht gestartet werden.', details: err.message });
    }
});

module.exports = router;

