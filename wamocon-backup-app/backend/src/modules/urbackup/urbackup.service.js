const { UrbackupServer } = require('urbackup-server-api');
const crypto = require('crypto');
require('dotenv').config();

const URBACKUP_URL = process.env.URBACKUP_URL || 'http://localhost:55414';
const URBACKUP_USERNAME = process.env.URBACKUP_USERNAME || 'admin';
const URBACKUP_PASSWORD = process.env.URBACKUP_PASSWORD || 'admin';

// Normalize URL so it ends without slash and append /x for the API path
const getApiUrl = () => {
    const base = URBACKUP_URL.replace(/\/+$/, '');
    return `${base}/x`;
};

// Direct HTTP auth + API call – bypasses bug in urbackup-server-api where
// the condition `Array.isArray(result) && result.filter(...).length !== 1`
// is inverted: when the server returns [{start_ok:true}] the filter finds
// exactly 1 element so `!== 1` evaluates to false, incorrectly throwing an error.
const VALID_BACKUP_TYPES = ['full_file', 'incr_file', 'full_image', 'incr_image'];

const startBackup = async (clientId, backupType) => {
    if (!VALID_BACKUP_TYPES.includes(backupType)) {
        throw new Error(`Invalid backupType: ${backupType}`);
    }

    const apiUrl = getApiUrl();

    // Step 1 – get salt + temporary session id
    const saltResp = await fetch(`${apiUrl}?a=salt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: URBACKUP_USERNAME }).toString()
    });
    if (!saltResp.ok) throw new Error('URBackup salt request failed');
    const saltData = await saltResp.json();

    // Step 2 – hash password (PBKDF2 + MD5, matching library logic)
    const { salt, pbkdf2_rounds, rnd, ses } = saltData;
    let passwordHash = crypto.createHash('md5').update(salt + URBACKUP_PASSWORD, 'utf8').digest();
    let derivedKey;
    if (pbkdf2_rounds > 0) {
        derivedKey = await new Promise((resolve, reject) => {
            crypto.pbkdf2(passwordHash, salt, pbkdf2_rounds, 32, 'sha256', (err, key) => {
                err ? reject(err) : resolve(key);
            });
        });
    }
    const finalHash = crypto.createHash('md5')
        .update(rnd + (pbkdf2_rounds > 0 ? derivedKey.toString('hex') : passwordHash), 'utf8')
        .digest('hex');

    // Step 3 – login
    const loginResp = await fetch(`${apiUrl}?a=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: URBACKUP_USERNAME, password: finalHash, ses }).toString()
    });
    if (!loginResp.ok) throw new Error('URBackup login failed');
    const loginData = await loginResp.json();
    if (!loginData.success) throw new Error('URBackup authentication failed');

    // Step 4 – trigger backup
    const startResp = await fetch(`${apiUrl}?a=start_backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            start_client: String(clientId),
            start_type: backupType,
            ses
        }).toString()
    });
    if (!startResp.ok) throw new Error('URBackup start_backup request failed');
    const startData = await startResp.json();

    if (Array.isArray(startData.result) && startData.result.length > 0) {
        return { success: !!startData.result[0].start_ok, raw: startData.result[0] };
    }
    throw new Error('Unexpected start_backup response: ' + JSON.stringify(startData));
};

let client = null;

const getClient = () => {
    if (!client) {
        client = new UrbackupServer({
            url: URBACKUP_URL,
            username: URBACKUP_USERNAME,
            password: URBACKUP_PASSWORD
        });
    }
    return client;
};

const getStatus = async () => {
    try {
        return await getClient().getStatus();
    } catch (error) {
        client = null; // Reset on error so next call retries
        console.error('Error fetching UrBackup status:', error.message);
        throw error;
    }
};

const getClientBackups = async (clientId) => {
    try {
        return await getClient().getBackups({ clientId });
    } catch (error) {
        client = null;
        console.error(`Error fetching backups for client ${clientId}:`, error.message);
        throw error;
    }
};

const getActivities = async () => {
    try {
        return await getClient().getActivities();
    } catch (error) {
        client = null;
        console.error('Error fetching UrBackup activities:', error.message);
        throw error;
    }
};

const getUsage = async () => {
    try {
        return await getClient().getUsage();
    } catch (error) {
        client = null;
        console.error('Error fetching UrBackup usage:', error.message);
        throw error;
    }
};

module.exports = {
    getStatus,
    getClientBackups,
    getActivities,
    getUsage,
    startBackup
};

