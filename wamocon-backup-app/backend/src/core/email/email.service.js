const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

async function sendFailureNotification(job, run, errorMessage) {
    const to = process.env.NOTIFY_EMAIL;
    if (!to) return;

    const subject = `⚠️ Backup fehlgeschlagen: [${job.name}]`;
    const text = `
Ein Backup-Job ist fehlgeschlagen!

Job: ${job.name} (ID: ${job.id})
Wann: ${new Date().toLocaleString()}
Grund: ${errorMessage || 'Unbekannter Fehler'}

Bitte im WAMOCON Backup-Dashboard prüfen.
    `.trim();

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to,
            subject,
            text
        });
        console.log(`[Email] Best failure notice sent to ${to}`);
    } catch (err) {
        console.error(`[Email] Failed to send failure notice:`, err.message);
    }
}

async function sendSuccessNotification(job, run) {
    const to = process.env.NOTIFY_EMAIL;
    if (!to) return;

    const subject = `✅ Backup erfolgreich: [${job.name}]`;
    const text = `
Der Backup-Job wurde erfolgreich abgeschlossen.

Job: ${job.name} (ID: ${job.id})
Wann: ${new Date().toLocaleString()}

Weitere Details im WAMOCON Backup-Dashboard.
    `.trim();

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to,
            subject,
            text
        });
        console.log(`[Email] Success notice sent to ${to}`);
    } catch (err) {
        console.error(`[Email] Failed to send success notice:`, err.message);
    }
}

module.exports = {
    sendFailureNotification,
    sendSuccessNotification
};
