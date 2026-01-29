const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../database/erp.db');

const db = new sqlite3.Database(dbPath);

console.log('🚀 Starting Full Database Schema Audit...');

db.serialize(() => {
    // Get all tables
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", (err, tables) => {
        if (err) {
            console.error('❌ Failed to list tables:', err.message);
            return;
        }

        let processed = 0;
        tables.forEach(table => {
            db.all(`PRAGMA table_info(${table.name})`, (err, cols) => {
                if (err) {
                    console.error(`❌ Failed to get info for ${table.name}:`, err.message);
                } else {
                    console.log(`\n📦 TABLE: ${table.name}`);
                    cols.forEach(c => {
                        let desc = `   - ${c.name} (${c.type})`;
                        if (c.notnull) desc += ' NOT NULL';
                        if (c.dflt_value) desc += ` DEFAULT ${c.dflt_value}`;
                        if (c.pk) desc += ' PRIMARY KEY';
                        console.log(desc);
                    });
                }

                processed++;
                if (processed === tables.length) {
                    db.close();
                }
            });
        });
    });
});
