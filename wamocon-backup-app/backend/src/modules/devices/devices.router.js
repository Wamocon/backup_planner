const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { requireAuth } = require('../../core/middleware/auth.middleware');
const { requireAdmin } = require('../../core/middleware/role.middleware');

router.use(requireAuth);

// GET /api/devices — all urbackup clients joined with device_owners metadata
router.get('/', (req, res) => {
    const rows = db.prepare(`
        SELECT
            uc.id,
            uc.name,
            uc.online,
            uc.last_file_backup,
            uc.last_image_backup,
            uc.file_ok,
            uc.image_ok,
            uc.file_disabled,
            uc.image_disabled,
            uc.client_version,
            uc.synced_at,
            do.id         AS owner_id,
            do.display_name,
            do.owner_name,
            do.department,
            do.location,
            do.notes,
            do.updated_at AS owner_updated_at
        FROM urbackup_clients uc
        LEFT JOIN device_owners do ON do.urbackup_client_id = uc.id
        ORDER BY uc.name ASC
    `).all();
    res.json(rows);
});

// PUT /api/devices/:clientId — upsert owner metadata (admin only)
router.put('/:clientId', requireAdmin, (req, res) => {
    const clientId = parseInt(req.params.clientId);
    if (isNaN(clientId)) return res.status(400).json({ error: 'Invalid clientId' });

    const { display_name, owner_name, department, location, notes } = req.body;

    // Verify client exists
    const client = db.prepare('SELECT id FROM urbackup_clients WHERE id = ?').get(clientId);
    if (!client) return res.status(404).json({ error: 'Client not found' });

    db.prepare(`
        INSERT INTO device_owners (urbackup_client_id, display_name, owner_name, department, location, notes, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(urbackup_client_id) DO UPDATE SET
            display_name = excluded.display_name,
            owner_name   = excluded.owner_name,
            department   = excluded.department,
            location     = excluded.location,
            notes        = excluded.notes,
            updated_at   = CURRENT_TIMESTAMP
    `).run(clientId, display_name || null, owner_name || null, department || null, location || null, notes || null);

    res.json({ ok: true });
});

// DELETE /api/devices/:clientId/owner — remove owner assignment (admin only)
router.delete('/:clientId/owner', requireAdmin, (req, res) => {
    const clientId = parseInt(req.params.clientId);
    if (isNaN(clientId)) return res.status(400).json({ error: 'Invalid clientId' });
    db.prepare('DELETE FROM device_owners WHERE urbackup_client_id = ?').run(clientId);
    res.json({ ok: true });
});

module.exports = router;
