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
