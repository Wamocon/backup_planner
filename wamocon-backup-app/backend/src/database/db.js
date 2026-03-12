const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../../data/wamocon.db');

const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

const schemaPath = path.join(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schema);
}

// Migration: Add 'gobd' to backup_type CHECK constraint
// SQLite cannot ALTER CHECK constraints, so we recreate the table if needed
try {
    // Test if 'gobd' is already accepted
    const testStmt = db.prepare(`
        INSERT INTO backup_jobs (name, source, destination, backup_type, schedule, created_by)
        VALUES ('__migration_test__', 'test:', 'test:', 'gobd', '0 0 * * *', NULL)
    `);
    const testResult = testStmt.run();
    db.prepare('DELETE FROM backup_jobs WHERE id = ?').run(testResult.lastInsertRowid);
} catch (e) {
    // 'gobd' not accepted yet - recreate table with updated constraint
    console.log('[Migration] Updating backup_jobs table to support gobd backup type...');
    db.exec(`
        CREATE TABLE backup_jobs_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            source TEXT NOT NULL,
            destination TEXT NOT NULL,
            backup_type TEXT NOT NULL CHECK(backup_type IN ('full', 'incremental', 'differential', 'gobd')),
            schedule TEXT NOT NULL,
            retention_days INTEGER DEFAULT 90,
            is_active INTEGER DEFAULT 1,
            created_by INTEGER REFERENCES users(id),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO backup_jobs_new SELECT * FROM backup_jobs;
        DROP TABLE backup_jobs;
        ALTER TABLE backup_jobs_new RENAME TO backup_jobs;
    `);
    console.log('[Migration] backup_jobs table updated successfully.');
}

const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
if (usersCount === 0) {
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const guestPassword = bcrypt.hashSync('guest123', 10);

    const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, role) 
    VALUES (?, ?, ?)
  `);

    insertUser.run('admin', adminPassword, 'admin');
    insertUser.run('guest', guestPassword, 'guest');
    console.log('Seeded initial users: admin & guest');
}

module.exports = db;
