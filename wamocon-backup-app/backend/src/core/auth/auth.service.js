const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../../database/db');

async function loginUser(username, password) {
    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = rows[0];

    if (!user) {
        throw new Error('User not found');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
        throw new Error('Invalid credentials');
    }

    const payload = {
        id: user.id,
        username: user.username,
        role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    return { token, user: payload };
}

async function getUserById(id) {
    const { rows } = await pool.query(
        'SELECT id, username, role, email, created_at FROM users WHERE id = $1',
        [id]
    );
    return rows[0];
}

module.exports = { loginUser, getUserById };
