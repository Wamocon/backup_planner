const MACSTUDIO_URL = process.env.MACSTUDIO_URL || 'http://192.168.178.62:9090';
const MACSTUDIO_API_KEY = process.env.MACSTUDIO_API_KEY || '';

function buildHeaders(withBody = false) {
    const headers = {};
    if (withBody) headers['Content-Type'] = 'application/json';
    if (MACSTUDIO_API_KEY) headers['X-API-Key'] = MACSTUDIO_API_KEY;
    return headers;
}

async function getStatus() {
    const res = await fetch(`${MACSTUDIO_URL}/api/backup/status`, {
        headers: buildHeaders(),
        signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

async function getHealth() {
    const res = await fetch(`${MACSTUDIO_URL}/api/health`, {
        headers: buildHeaders(),
        signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

// Requires POST /api/backup/trigger endpoint on the MacStudio dashboard
async function triggerBackup(target = 'all') {
    const res = await fetch(`${MACSTUDIO_URL}/api/backup/trigger`, {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify({ target }),
        signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return res.json();
}

module.exports = { getStatus, getHealth, triggerBackup };
