const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const pool = require('../../database/db');
const { requireAuth } = require('../../core/middleware/auth.middleware');
const { requireAdmin } = require('../../core/middleware/role.middleware');

router.use(requireAuth, requireAdmin);

// GET /api/settings — return all config entries as key-value object
router.get('/', async (req, res) => {
    const { rows } = await pool.query('SELECT key, value FROM config');
    const settings = {};
    for (const row of rows) {
        settings[row.key] = row.value;
    }
    res.json(settings);
});

// PUT /api/settings — upsert multiple config entries
router.put('/', async (req, res) => {
    const input = req.body;
    if (typeof input !== 'object' || Array.isArray(input)) {
        return res.status(400).json({ error: 'Body must be a key-value object' });
    }
    for (const [key, value] of Object.entries(input)) {
        await pool.query(
            `INSERT INTO config (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
            [key, String(value ?? '')]
        );
    }
    res.json({ ok: true });
});

// POST /api/settings/test-email — send a test e-mail using current settings
router.post('/test-email', async (req, res) => {
    const { rows } = await pool.query('SELECT key, value FROM config');
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
