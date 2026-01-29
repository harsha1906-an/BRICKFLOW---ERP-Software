const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./database/erp.db');

bcrypt.hash('admin123', 10).then(hash => {
    console.log('Generated hash:', hash);

    db.run('UPDATE users SET password = ? WHERE username = ?', [hash, 'admin'], function (err) {
        if (err) {
            console.error('Error updating password:', err);
        } else {
            console.log('✅ Password updated successfully');

            // Verify it worked
            db.get('SELECT username, password FROM users WHERE username = ?', ['admin'], async (err, row) => {
                if (err) {
                    console.error('Error verifying:', err);
                } else {
                    const match = await bcrypt.compare('admin123', row.password);
                    console.log('Password hash in DB:', row.password);
                    console.log('Verification - admin123 matches:', match);
                }
                db.close();
            });
        }
    });
});
