const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../database/erp.db');

const db = new sqlite3.Database(dbPath);

function run(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

async function dropLegacy() {
    console.log('🚀 Phase 6: Dropping Legacy Column (is_accountable)...');

    try {
        await run(db, "PRAGMA foreign_keys = OFF");

        // SQLite doesn't support DROP COLUMN directly in older versions, 
        // but even if it does, recreating is safer to enforce new schema order and constraints.

        console.log('📦 Renaming table...');
        await run(db, "ALTER TABLE payments RENAME TO payments_old_acc_refactor");

        console.log('🏗️ Creating new table with strict schema...');
        // Note: New schema has accounting_type NOT NULL, and NO is_accountable
        await run(db, `CREATE TABLE payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL,
            payment_date DATETIME NOT NULL,
            amount REAL NOT NULL,
            payment_method_id INTEGER NOT NULL REFERENCES payment_methods(id),
            reference_number TEXT,
            notes TEXT,
            has_gst INTEGER DEFAULT 0,
            gst_percentage REAL DEFAULT 0,
            gst_amount REAL DEFAULT 0,
            accounting_type TEXT NOT NULL CHECK(accounting_type IN ('ACCOUNTABLE', 'NON_ACCOUNTABLE')),
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        )`);

        console.log('📋 Migrating data to new table...');
        // We select accounting_type which was already populated in Phase 1
        await run(db, `
            INSERT INTO payments (
                id, booking_id, payment_date, amount, payment_method_id, 
                reference_number, notes, has_gst, gst_percentage, 
                gst_amount, accounting_type, created_by, created_at
            )
            SELECT 
                id, booking_id, payment_date, amount, payment_method_id, 
                reference_number, notes, has_gst, gst_percentage, 
                gst_amount, accounting_type, created_by, created_at
            FROM payments_old_acc_refactor
            WHERE accounting_type IS NOT NULL 
        `);
        // Note: We filter IS NOT NULL just in case, but Phase 1 ensured coverage.

        console.log('🗑️ Dropping old table...');
        await run(db, "DROP TABLE payments_old_acc_refactor");

        await run(db, "PRAGMA foreign_keys = ON");

        console.log('✅ Phase 6 Completed: Schema is now strict.');

    } catch (error) {
        console.error('❌ Phase 6 Failed:', error);
    } finally {
        db.close();
    }
}

dropLegacy();
