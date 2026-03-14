module.exports = {
    apps: [
        {
            name: 'wamocon-backup-backend',
            script: './backend/src/index.js',
            cwd: './backend',
            env: {
                NODE_ENV: 'production',
                PORT: 3001
            },
            restart_delay: 5000,
            max_restarts: 10,
            log_file: '../logs/app.log',
        }
    ]
};
