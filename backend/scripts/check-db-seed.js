const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../database/erp.db');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('Checking tables...');
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) console.error(err);
        else console.log('Tables:', tables.map(t => t.name).join(', '));
    });

    console.log('\nChecking Projects...');
    db.all("SELECT * FROM projects LIMIT 1", (err, rows) => {
        console.log('Projects:', rows);
    });

    console.log('\nChecking Customers...');
    db.all("SELECT * FROM customers LIMIT 1", (err, rows) => {
        console.log('Customers:', rows);
    });
});

setTimeout(() => db.close(), 1000);
