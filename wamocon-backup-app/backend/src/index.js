const express = require('express');
const cors = require('cors');
require('express-async-errors'); // Helps with async error handling without try/catch wrapper
require('dotenv').config();

const authRouter = require('./core/auth/auth.router');
const backupRouter = require('./modules/backup/backup.router');
const dashboardRouter = require('./modules/dashboard/dashboard.router');
const runsRouter = require('./modules/backup/runs.router');
const urbackupRouter = require('./modules/urbackup/urbackup.router');
const devicesRouter = require('./modules/devices/devices.router');
const macstudioRouter = require('./modules/macstudio/macstudio.router');
const settingsRouter = require('./modules/settings/settings.router');

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/jobs', backupRouter);
app.use('/api/runs', runsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/urbackup', urbackupRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/macstudio', macstudioRouter);
app.use('/api/settings', settingsRouter);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const PORT = process.env.PORT || 3001;

// Initialize Cron Scheduler (rclone backup jobs)
const scheduler = require('./modules/backup/scheduler.service');
scheduler.initializeScheduler();

// Initialize URBackup Sync Scheduler
const urbackupSync = require('./modules/urbackup/urbackup.sync.service');
urbackupSync.initializeSyncScheduler();

app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
