const express = require('express');
const router = express.Router();
const authService = require('./auth.service');
const { requireAuth } = require('../middleware/auth.middleware');

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const { token, user } = authService.loginUser(username, password);
        res.json({ token, user });
    } catch (err) {
        res.status(401).json({ error: 'Auth Failed', message: err.message });
    }
});

router.post('/logout', requireAuth, (req, res) => {
    // In stateless JWT, logout is usually handled client-side by destroying the token
    res.json({ message: 'Logged out successfully' });
});

router.get('/me', requireAuth, (req, res) => {
    const user = authService.getUserById(req.user.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
});

module.exports = router;
