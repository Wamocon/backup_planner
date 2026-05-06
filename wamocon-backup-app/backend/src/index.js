const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); // Force IPv4 for Supabase connections on Windows

const express = require('express');
const cors = require('cors');
require('express-async-errors');
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

// CORS: allow configured origins or fall back to dev default
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:5173'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, Postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'WamoconBackup API', version: '1.0' });
});

app.use('/api/auth', authRouter);
app.use('/api/jobs', backupRouter);
app.use('/api/runs', runsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/urbackup', urbackupRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/macstudio', macstudioRouter);
app.use('/api/settings', settingsRouter);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const PORT = process.env.PORT || 3001;

async function start() {
    // Initialize DB (apply schema + seed) before accepting requests
    const db = require('./database/db');
    await db.initialize();
    console.log('[DB] Connected and ready.');

    const scheduler = require('./modules/backup/scheduler.service');
    await scheduler.initializeScheduler();

    const urbackupSync = require('./modules/urbackup/urbackup.sync.service');
    urbackupSync.initializeSyncScheduler();

    app.listen(PORT, () => {
        console.log(`Backend server running on port ${PORT}`);
    });
}

start().catch(err => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
});

