const express = require('express');
const cors = require('cors');
require('express-async-errors'); // Helps with async error handling without try/catch wrapper
require('dotenv').config();

const authRouter = require('./core/auth/auth.router');
const backupRouter = require('./modules/backup/backup.router');
const dashboardRouter = require('./modules/dashboard/dashboard.router');
const runsRouter = require('./modules/backup/runs.router');
const urbackupRouter = require('./modules/urbackup/urbackup.router');

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/jobs', backupRouter);
app.use('/api/runs', runsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/urbackup', urbackupRouter);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const PORT = process.env.PORT || 3001;

// Initialize Cron Scheduler
const scheduler = require('./modules/backup/scheduler.service');
scheduler.initializeScheduler();

app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
