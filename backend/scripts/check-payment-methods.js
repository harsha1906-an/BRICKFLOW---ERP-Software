const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../database/erp.db');

const db = new sqlite3.Database(dbPath);

console.log('🚀 Checking Payment Methods Schema...');

db.serialize(() => {
    // 1. Check if payment_methods table exists
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='payment_methods'", (err, table) => {
        console.log(`1. payment_methods table exists? ${table ? '✅ YES' : '❌ NO'}`);
    });

    // 2. Check payments table columns for FK
    db.all("PRAGMA table_info(payments)", (err, cols) => {
        const hasMethodId = cols.some(c => c.name === 'payment_method_id');
        const hasMethodText = cols.some(c => c.name === 'payment_method');

        console.log(`2. payment_method_id (FK) exists? ${hasMethodId ? '✅ YES' : '❌ NO'}`);
        console.log(`3. payment_method (String) exists? ${hasMethodText ? '❌ YES (Should be removed)' : '✅ NO'}`);
    });

    // 3. Count methods
    db.all("SELECT * FROM payment_methods", (err, rows) => {
        if (err) console.log('   (Cannot list methods, table might be missing)');
        else {
            console.log(`4. Supported Methods: ${rows.map(r => r.code).join(', ')}`);
        }
    });
});

setTimeout(() => db.close(), 1000);
