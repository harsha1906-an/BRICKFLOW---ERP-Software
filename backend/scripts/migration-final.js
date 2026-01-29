const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../database/erp.db');

const db = new sqlite3.Database(dbPath);

console.log('🚀 Starting Robust Migration...');

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, function (err, rows) {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function migrate() {
    try {
        db.serialize(async () => {
            // 1. Simple Alters (Idempotent-ish via error suppression)
            try {
                await run("ALTER TABLE purchases ADD COLUMN created_by INTEGER REFERENCES users(id)");
                console.log('✅ Added created_by to purchases');
            } catch (e) { console.log('⚠️ (purchases) ' + e.message); }

            try {
                await run("ALTER TABLE labour_attendance ADD COLUMN substitute_labour_id INTEGER REFERENCES labours(id)");
                console.log('✅ Added substitute_labour_id to labour_attendance');
            } catch (e) { console.log('⚠️ (labour_attendance) ' + e.message); }

            // 2. Payments Table Recreation
            console.log('🔄 Recreating Payments Table...');

            // Allow schema changes
            await run('PRAGMA foreign_keys = OFF');

            // Clean up
            await run('DROP TABLE IF EXISTS payments_old');

            // Rename existing
            await run('ALTER TABLE payments RENAME TO payments_old');

            // Get columns of old table to know what we can copy
            const oldCols = await all('PRAGMA table_info(payments_old)');
            const oldColNames = oldCols.map(c => c.name);
            console.log('📄 Existing columns:', oldColNames.join(', '));

            // Create NEW table with ALL desired columns + updated constraints
            await run(`
                CREATE TABLE IF NOT EXISTS payments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    booking_id INTEGER NOT NULL,
                    payment_date DATE NOT NULL,
                    amount DECIMAL(12, 2) NOT NULL CHECK(amount > 0),
                    payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'bank', 'online', 'cheque', 'loan', 'upi', 'neft', 'rtgs')),
                    reference_number TEXT,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    created_by INTEGER REFERENCES users(id),
                    has_gst INTEGER DEFAULT 0,
                    gst_percentage DECIMAL(5, 2) DEFAULT 0,
                    gst_amount DECIMAL(10, 2) DEFAULT 0,
                    is_accountable INTEGER DEFAULT 1,
                    FOREIGN KEY (booking_id) REFERENCES bookings(id)
                )
            `);

            // Build dynamic INSERT ... SELECT statement
            // Target columns: [id, booking_id, payment_date, amount, payment_method, reference_number, notes, created_at, created_by, has_gst, gst_percentage, gst_amount, is_accountable]
            // For each target col, if exists in old, SELECT it. Else SELECT default.

            const targetCols = [
                'id', 'booking_id', 'payment_date', 'amount', 'payment_method', 'reference_number', 'notes', 'created_at',
                'created_by', 'has_gst', 'gst_percentage', 'gst_amount', 'is_accountable'
            ];

            const selectParts = targetCols.map(col => {
                if (oldColNames.includes(col)) return col;
                // Defaults for missing columns
                if (col === 'created_by') return 'NULL'; // or 1 for Admin
                if (['has_gst', 'gst_percentage', 'gst_amount'].includes(col)) return '0';
                if (col === 'is_accountable') return '1';
                return 'NULL';
            });

            const insertSql = `INSERT INTO payments (${targetCols.join(', ')}) SELECT ${selectParts.join(', ')} FROM payments_old`;
            console.log('📋 Running Copy:', insertSql);

            await run(insertSql);
            console.log('✅ Data Copied successfully');

            await run('DROP TABLE payments_old');

            await run('PRAGMA foreign_keys = ON');
            console.log('🎉 Migration FINISHED');
        });
    } catch (e) {
        console.error('💥 FATAL ERROR:', e);
        // Attempt rollback? No transaction was explicitly started in this async block (db.serialize doesn't auto-transact across promises if not using db.exec)
        // Manual fix might be needed if it failed halfway.
    } finally {
        // db.close() should be called, but since we are inside async wrapper but db.serialize is not strictly async-await aware in node-sqlite3 (it expects callbacks), 
        // we might exit early.
        // Actually, mixing await and db.serialize is tricky.
        // Better to just let the script finish.
    }
}

// Wrap in timeout to force exit if stuck
setTimeout(() => { console.log('Timeout - Check status'); process.exit(0); }, 10000);

migrate();
