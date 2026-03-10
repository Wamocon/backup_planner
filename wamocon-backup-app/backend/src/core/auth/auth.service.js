const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../../database/db');

function loginUser(username, password) {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user) {
        throw new Error('User not found');
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);

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

function getUserById(id) {
    const user = db.prepare('SELECT id, username, role, email, created_at FROM users WHERE id = ?').get(id);
    return user;
}

module.exports = { loginUser, getUserById };
