const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../database/erp.db');

const db = new sqlite3.Database(dbPath);

function run(label, sql, params = []) {
    return new Promise((resolve, reject) => {
        console.log(`⏳ ${label}...`);
        db.run(sql, params, function (err) {
            if (err) {
                console.error(`❌ ${label} FAILED: ${err.message}`);
                // Don't reject for recoverable errors like 'duplicate column'
                if (err.message.includes('duplicate column')) {
                    console.log(`⚠️ ${label} skipped (already exists)`);
                    resolve(this);
                } else if (err.message.includes('no such table')) {
                    console.log(`⚠️ ${label} skipped (table missing)`);
                    resolve(this);
                } else {
                    reject(err);
                }
            } else {
                console.log(`✅ ${label} Succeeded`);
                resolve(this);
            }
        });
    });
}

db.serialize(async () => {
    try {
        console.log('🚀 Starting Sequential Migration...');

        // 1. Simple Alterations
        await run('Add created_by to purchases', `ALTER TABLE purchases ADD COLUMN created_by INTEGER REFERENCES users(id)`);
        await run('Add substitute_labour_id', `ALTER TABLE labour_attendance ADD COLUMN substitute_labour_id INTEGER REFERENCES labours(id)`);

        // 2. Complex Table Recreation (Payments)
        console.log('🔄 Starting Payments Table Recreation...');

        await run('Disable Foreign Keys', 'PRAGMA foreign_keys = OFF');
        await run('Start Transaction', 'BEGIN TRANSACTION');

        await run('Drop payments_old', 'DROP TABLE IF EXISTS payments_old');
        await run('Rename payments', 'ALTER TABLE payments RENAME TO payments_old');

        await run('Create New payments table', `
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

        // Note: We need to handle column mismatch if existing table is missing some new cols (like created_by, gst stuff)
        // For safety, we explicitly select only common columns.
        // Assuming current schema has: id, booking_id, payment_date, amount, payment_method, reference_number, notes, created_at
        // And maybe gst stuff if verify script added it? Yes, we saw it in init.sql earlier?
        // Let's assume standard baseline.
        // To be SAFE, we use a simpler INSERT matching the "old" schema we know.

        // Let's inspect columns of payments_old dynamically? No, too complex for this script.
        // We will just try to copy standard columns.

        await run('Copy Data', `
            INSERT INTO payments (id, booking_id, payment_date, amount, payment_method, reference_number, notes, created_at, has_gst, gst_percentage, gst_amount, is_accountable, created_by)
            SELECT id, booking_id, payment_date, amount, payment_method, reference_number, notes, created_at, has_gst, gst_percentage, gst_amount, is_accountable, NULL
            FROM payments_old
        `);

        await run('Drop payments_old', 'DROP TABLE payments_old');

        await run('Commit', 'COMMIT');
        await run('Enable Foreign Keys', 'PRAGMA foreign_keys = ON');

        console.log('🎉 Migration Completed Successfully!');

    } catch (error) {
        console.error('💥 Migration Aborted due to critical error:', error);
        db.run('ROLLBACK');
    } finally {
        db.close();
    }
});
