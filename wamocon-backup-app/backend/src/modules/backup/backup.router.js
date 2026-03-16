const express = require('express');
const router = express.Router();
const backupService = require('./backup.service');
const rcloneService = require('./rclone.service');
const { requireAuth } = require('../../core/middleware/auth.middleware');
const { requireAdmin } = require('../../core/middleware/role.middleware');

// All endpoints require at least auth
router.use(requireAuth);

router.get('/', async (req, res) => {
    const jobs = await backupService.getAllJobs();
    res.json(jobs);
});

router.get('/:id', async (req, res) => {
    const job = await backupService.getJobById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
});

router.post('/', requireAdmin, async (req, res) => {
    try {
        const newJob = await backupService.createJob(req.body, req.user.id);
        res.status(201).json(newJob);
    } catch (err) {
        res.status(400).json({ error: 'Failed to create job', details: err.message });
    }
});

router.put('/:id', requireAdmin, async (req, res) => {
    try {
        const updated = await backupService.updateJob(req.params.id, req.body);
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: 'Failed to update job', details: err.message });
    }
});

router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const success = await backupService.deleteJob(req.params.id);
        if (success) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Job not found' });
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/:id/run', requireAdmin, async (req, res) => {
    try {
        const job = backupService.getJobById(req.params.id);
        if (!job) return res.status(404).json({ error: 'Job not found' });

        // This runs asynchronously in the background so we await its kickoff
        const runId = await rcloneService.runBackupJob(job, 'manual');
        res.json({ message: 'Job triggered manually', run_id: runId });
    } catch (err) {
        res.status(500).json({ error: 'Failed to start job manually', details: err.message });
    }
});

module.exports = router;
