function requireAdmin(req, res, next) {
    // Expects req.user from auth.middleware.js
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden', message: 'Requires admin privileges' });
    }
    next();
}

module.exports = { requireAdmin };
