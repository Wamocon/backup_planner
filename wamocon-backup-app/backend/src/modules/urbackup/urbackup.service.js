const urbackup = require('urbackup-server-api');
require('dotenv').config();

// Default values, can be overridden by environment variables
const URBACKUP_URL = process.env.URBACKUP_URL || 'http://localhost:55414';
const URBACKUP_USERNAME = process.env.URBACKUP_USERNAME || 'admin';
const URBACKUP_PASSWORD = process.env.URBACKUP_PASSWORD || 'admin';

let client = null;
let isAuthenticated = false;

const initClient = async () => {
    if (!client) {
        client = new urbackup({
            url: URBACKUP_URL,
            username: URBACKUP_USERNAME,
            password: URBACKUP_PASSWORD
        });
    }

    if (!isAuthenticated) {
        try {
            await client.login();
            isAuthenticated = true;
            console.log('Successfully connected to UrBackup Server');
        } catch (error) {
            console.error('Failed to connect to UrBackup Server:', error.message);
            throw new Error('UrBackup connection failed');
        }
    }
    return client;
};

const getStatus = async () => {
    try {
        const c = await initClient();
        const status = await c.getStatus();
        return status;
    } catch (error) {
        console.error('Error fetching UrBackup status:', error.message);
        throw error;
    }
};

module.exports = {
    getStatus
};
