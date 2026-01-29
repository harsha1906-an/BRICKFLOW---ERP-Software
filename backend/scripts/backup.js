const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');

// Ensure backup directory exists
const backupDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

// Database path
const dbPath = path.join(__dirname, '..', 'database.db');

/**
 * Create a backup of the database
 */
function createBackup() {
    return new Promise((resolve, reject) => {
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const backupPath = path.join(backupDir, `database-${timestamp}.db`);

        if (!fs.existsSync(dbPath)) {
            return reject(new Error('Database file not found'));
        }

        fs.copyFile(dbPath, backupPath, (err) => {
            if (err) return reject(err);
            fs.stat(backupPath, (statErr, stats) => {
                if (statErr) return reject(statErr);
                resolve({ success: true, backupPath, size: stats.size, timestamp });
            });
        });
    });
}

/**
 * List all backups
 */
function listBackups() {
    const files = fs.readdirSync(backupDir);
    return files.filter(file => file.endsWith('.db'))
        .map(file => ({
            filename: file,
            size: fs.statSync(path.join(backupDir, file)).size,
            created: fs.statSync(path.join(backupDir, file)).mtime,
            path: path.join(backupDir, file)
        }))
        .sort((a, b) => b.created - a.created);
}

/**
 * Clean up old backups (keep last 30 days)
 */
function cleanupOldBackups(daysToKeep = 30) {
    const now = Date.now();
    const maxAge = daysToKeep * 24 * 60 * 60 * 1000;
    const backups = listBackups();
    let deletedCount = 0;

    backups.forEach(backup => {
        const age = now - backup.created.getTime();
        if (age > maxAge) {
            fs.unlinkSync(backup.path);
            deletedCount++;
        }
    });
    return deletedCount;
}

/**
 * Schedule automated daily backups
 */
function scheduleBackups() {
    // Run backup daily at 2 AM
    return schedule.scheduleJob('0 2 * * *', async () => {
        try {
            await createBackup();
            cleanupOldBackups(30);
        } catch (error) {
            console.error('Scheduled backup failed:', error.message);
        }
    });
}

// If run directly
if (require.main === module) {
    createBackup()
        .then(result => {
            console.log('✅ Backup created!');
            console.log('   Path:', result.backupPath);
            console.log('   Size:', (result.size / 1024).toFixed(2), 'KB');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Backup failed:', error.message);
            process.exit(1);
        });
}

module.exports = { createBackup, listBackups, cleanupOldBackups, scheduleBackups };
