const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const db = require('../../database/db');
const { requireAuth } = require('../../core/middleware/auth.middleware');
const { requireAdmin } = require('../../core/middleware/role.middleware');

router.use(requireAuth, requireAdmin);

// GET /api/settings — return all config entries as key-value object
router.get('/', (req, res) => {
    const rows = db.prepare('SELECT key, value FROM config').all();
    const settings = {};
    for (const row of rows) {
        settings[row.key] = row.value;
    }
    res.json(settings);
});

// PUT /api/settings — upsert multiple config entries
router.put('/', (req, res) => {
    const input = req.body;
    if (typeof input !== 'object' || Array.isArray(input)) {
        return res.status(400).json({ error: 'Body must be a key-value object' });
    }
    const stmt = db.prepare(
        'INSERT OR REPLACE INTO config (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)'
    );
    const upsertAll = db.transaction((entries) => {
        for (const [key, value] of entries) {
            stmt.run(key, String(value ?? ''));
        }
    });
    upsertAll(Object.entries(input));
    res.json({ ok: true });
});

// POST /api/settings/test-email — send a test e-mail using current settings
router.post('/test-email', async (req, res) => {
    const rows = db.prepare('SELECT key, value FROM config').all();
    const cfg = {};
    for (const row of rows) cfg[row.key] = row.value;

    const host = cfg['smtp_host'] || process.env.SMTP_HOST;
    const port = parseInt(cfg['smtp_port'] || process.env.SMTP_PORT || '587');
    const secure = (cfg['smtp_secure'] || process.env.SMTP_SECURE || 'false') === 'true';
    const user = cfg['smtp_user'] || process.env.SMTP_USER;
    const pass = cfg['smtp_password'] || process.env.SMTP_PASSWORD;
    const from = cfg['smtp_from'] || process.env.SMTP_FROM || user;
    const to = cfg['notify_email'] || process.env.NOTIFY_EMAIL;

    if (!host || !to) {
        return res.status(400).json({ error: 'SMTP-Host und Empfänger-Adresse müssen konfiguriert sein.' });
    }

    try {
        const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
        await transporter.sendMail({
            from,
            to,
            subject: '✅ WAMOCON Backup Planner – Test-E-Mail',
            text: 'Diese Test-E-Mail bestätigt, dass die SMTP-Konfiguration im Backup Planner korrekt ist.',
        });
        res.json({ ok: true, message: `Test-E-Mail wurde an ${to} gesendet.` });
    } catch (err) {
        res.status(500).json({ error: 'E-Mail-Versand fehlgeschlagen.', details: err.message });
    }
});

module.exports = router;
