const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'database/erp.db');
const db = new sqlite3.Database(dbPath);

const runObj = async () => {
    console.log('🔍 Debugging Auth...');

    db.get('SELECT * FROM users WHERE username = ?', ['admin'], async (err, row) => {
        if (err) {
            console.error('❌ DB Error:', err);
            return;
        }
        if (!row) {
            console.error('❌ User "admin" not found in DB');
            return;
        }

        console.log('✅ User found:', {
            id: row.id,
            username: row.username,
            role: row.role,
            is_active: row.is_active,
            password_hash_prefix: row.password ? row.password.substring(0, 10) + '...' : 'NULL'
        });

        const inputPassword = 'admin123';
        console.log(`\nTesting comparison with password: "${inputPassword}"`);

        try {
            const match = await bcrypt.compare(inputPassword, row.password);
            console.log(`Bcrypt Match Result: ${match}`);
            if (match) {
                console.log('✅ Password verifies correctly locally.');
            } else {
                console.log('❌ Password DOES NOT match.');
            }
        } catch (e) {
            console.error('❌ Bcrypt error:', e);
        }
    });
};

runObj();
