const express = require('express');
const router = express.Router();
const urbackupService = require('./urbackup.service');
const { requireAuth } = require('../../core/middleware/auth.middleware');

router.get('/status', requireAuth, async (req, res) => {
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

module.exports = router;
