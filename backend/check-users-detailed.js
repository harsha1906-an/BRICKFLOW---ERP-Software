const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'erp.db');
const db = new sqlite3.Database(dbPath);

console.log('--- Current Users in Database ---');
db.all('SELECT username, role FROM users', [], (err, rows) => {
    if (err) {
        console.error('Error reading users:', err);
    } else {
        rows.forEach(row => {
            console.log(`Username: ${row.username} | Role: ${row.role}`);
        });
    }
    db.close();
});
