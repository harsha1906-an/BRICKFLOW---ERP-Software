const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'database/erp.db');
const db = new sqlite3.Database(dbPath);

const runObj = async () => {
    console.log('🔧 Fixing Admin Password...');

    try {
        const hash = await bcrypt.hash('admin123', 10);

        db.run('UPDATE users SET password = ? WHERE username = ?', [hash, 'admin'], function (err) {
            if (err) {
                console.error('❌ Update Error:', err);
            } else {
                console.log(`✅ Password updated for admin. Changes: ${this.changes}`);
            }
            db.close();
        });

    } catch (e) {
        console.error('❌ Error:', e);
    }
};

runObj();
