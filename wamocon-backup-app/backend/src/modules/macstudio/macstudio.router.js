const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../core/middleware/auth.middleware');
const { requireAdmin } = require('../../core/middleware/role.middleware');
const macstudioService = require('./macstudio.service');

router.use(requireAuth);

const VALID_TARGETS = ['gdrive', 'nas', 'all'];

// GET /api/macstudio/status — aktueller Backup-Status beider Jobs
router.get('/status', async (req, res) => {
    try {
        const status = await macstudioService.getStatus();
        res.json(status);
    } catch (err) {
        res.status(503).json({ error: 'MacStudio nicht erreichbar', details: err.message });
    }
});

// GET /api/macstudio/health — Health-Check des MacStudio Dashboards
router.get('/health', async (req, res) => {
    try {
        const health = await macstudioService.getHealth();
        res.json(health);
    } catch (err) {
        res.status(503).json({ error: 'MacStudio nicht erreichbar', details: err.message });
    }
});

// POST /api/macstudio/trigger — Backup manuell anstoßen (nur Admin)
router.post('/trigger', requireAdmin, async (req, res) => {
    const { target = 'all' } = req.body;

    if (!VALID_TARGETS.includes(target)) {
        return res.status(400).json({ error: `Ungültiges Ziel. Erlaubt: ${VALID_TARGETS.join(', ')}` });
    }

    try {
        const result = await macstudioService.triggerBackup(target);
        res.json(result);
    } catch (err) {
        res.status(502).json({ error: 'Trigger fehlgeschlagen', details: err.message });
    }
});

module.exports = router;
