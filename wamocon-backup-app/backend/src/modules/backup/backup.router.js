const express = require('express');
const router = express.Router();
const backupService = require('./backup.service');
const rcloneService = require('./rclone.service');
const { requireAuth } = require('../../core/middleware/auth.middleware');
const { requireAdmin } = require('../../core/middleware/role.middleware');

// All endpoints require at least auth
router.use(requireAuth);

router.get('/', (req, res) => {
    const jobs = backupService.getAllJobs();
    res.json(jobs);
});

router.get('/:id', (req, res) => {
    const job = backupService.getJobById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
});

router.post('/', requireAdmin, (req, res) => {
    try {
        const newJob = backupService.createJob(req.body, req.user.id);
        res.status(201).json(newJob);
    } catch (err) {
        res.status(400).json({ error: 'Failed to create job', details: err.message });
    }
});

router.put('/:id', requireAdmin, (req, res) => {
    try {
        const updated = backupService.updateJob(req.params.id, req.body);
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: 'Failed to update job', details: err.message });
    }
});

router.delete('/:id', requireAdmin, (req, res) => {
    const success = backupService.deleteJob(req.params.id);
    if (success) {
        res.status(204).send();
    } else {
        res.status(404).json({ error: 'Job not found' });
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
