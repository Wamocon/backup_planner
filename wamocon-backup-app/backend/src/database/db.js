const { Pool } = require('pg');
const dns = require('dns').promises;
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

let pool;

async function createPool() {
    const connStr = process.env.DATABASE_URL;
    if (!connStr) throw new Error('DATABASE_URL is not set in environment');

    const url = new URL(connStr);

    // Resolve hostname to IPv4 to avoid EACCES on Windows with IPv6
    let host = url.hostname;
    try {
        const addresses = await dns.resolve4(url.hostname);
        if (addresses.length) host = addresses[0];
    } catch (_) {
        // Fall back to original hostname
    }

    return new Pool({
        host,
        port: parseInt(url.port) || 5432,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.slice(1),
        ssl: {
            rejectUnauthorized: false,
            servername: url.hostname  // SNI: required for Supabase SSL cert
        }
    });
}

async function initialize() {
    pool = await createPool();

    // Apply schema (CREATE TABLE IF NOT EXISTS — idempotent)
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf-8');
        await pool.query(schema);
        console.log('[DB] Schema applied.');
    }

    // Seed default users if table is empty
    const { rows } = await pool.query('SELECT COUNT(*) AS count FROM users');
    if (parseInt(rows[0].count) === 0) {
        const adminHash = await bcrypt.hash('admin123', 10);
        const guestHash = await bcrypt.hash('guest123', 10);
        await pool.query(
            'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
            ['admin', adminHash, 'admin']
        );
        await pool.query(
            'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
            ['guest', guestHash, 'guest']
        );
        console.log('[DB] Seeded initial users: admin & guest');
    }
}

// Proxy object: lets all modules call pool.query() before initialize() finishes
// (queries will queue until the pool is ready)
const poolProxy = new Proxy({ initialize }, {
    get(target, prop) {
        // Expose initialize() directly without needing pool
        if (prop === 'initialize') return target.initialize;
        if (!pool) throw new Error('[DB] pool.query() called before initialize() completed');
        return typeof pool[prop] === 'function' ? pool[prop].bind(pool) : pool[prop];
    }
});

module.exports = poolProxy;
