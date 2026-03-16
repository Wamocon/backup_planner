const express = require('express');
const router = express.Router();
const pool = require('../../database/db');
const { requireAuth } = require('../../core/middleware/auth.middleware');
const { requireAdmin } = require('../../core/middleware/role.middleware');

router.use(requireAuth);

// GET /api/devices — all urbackup clients joined with device_owners metadata
router.get('/', async (req, res) => {
    const { rows } = await pool.query(`
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
    `);
    res.json(rows);
});

// PUT /api/devices/:clientId — upsert owner metadata (admin only)
router.put('/:clientId', requireAdmin, async (req, res) => {
    const clientId = parseInt(req.params.clientId);
    if (isNaN(clientId)) return res.status(400).json({ error: 'Invalid clientId' });

    const { display_name, owner_name, department, location, notes } = req.body;

    const { rows } = await pool.query('SELECT id FROM urbackup_clients WHERE id = $1', [clientId]);
    if (!rows[0]) return res.status(404).json({ error: 'Client not found' });

    await pool.query(`
        INSERT INTO device_owners (urbackup_client_id, display_name, owner_name, department, location, notes, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        ON CONFLICT(urbackup_client_id) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            owner_name   = EXCLUDED.owner_name,
            department   = EXCLUDED.department,
            location     = EXCLUDED.location,
            notes        = EXCLUDED.notes,
            updated_at   = CURRENT_TIMESTAMP
    `, [clientId, display_name || null, owner_name || null, department || null, location || null, notes || null]);

    res.json({ ok: true });
});

// DELETE /api/devices/:clientId/owner — remove owner assignment (admin only)
router.delete('/:clientId/owner', requireAdmin, async (req, res) => {
    const clientId = parseInt(req.params.clientId);
    if (isNaN(clientId)) return res.status(400).json({ error: 'Invalid clientId' });
    await pool.query('DELETE FROM device_owners WHERE urbackup_client_id = $1', [clientId]);
    res.json({ ok: true });
});

module.exports = router;
