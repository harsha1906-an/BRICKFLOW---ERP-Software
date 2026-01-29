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

function get(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

async function migrate() {
    console.log('🚀 Starting Payment Method Migration...');

    try {
        // 1. Create payment_methods table
        console.log('📦 Creating payment_methods table...');
        await run(db, `CREATE TABLE IF NOT EXISTS payment_methods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 2. Seed Data
        console.log('🌱 Seeding payment methods...');
        const methods = [
            ['cash', 'Cash'],
            ['bank', 'Bank Transfer'],
            ['cheque', 'Cheque'],
            ['online', 'Online'],
            ['loan', 'Loan'],
            ['upi', 'UPI'],
            ['neft', 'NEFT'],
            ['rtgs', 'RTGS'],
            ['emi', 'EMI']
        ];

        for (const [code, name] of methods) {
            await run(db, "INSERT OR IGNORE INTO payment_methods (code, name) VALUES (?, ?)", [code, name]);
        }

        // 3. Add temporary column to payments
        console.log('🔧 Adding temporary column to payments...');
        try {
            await run(db, "ALTER TABLE payments ADD COLUMN payment_method_id INTEGER REFERENCES payment_methods(id)");
        } catch (e) {
            // Ignore if already exists (for idempotency)
            if (!e.message.includes('duplicate column')) throw e;
        }

        // 4. Migrate Data (Map string -> ID)
        console.log('🔄 Mapping existing payment methods to IDs...');
        await run(db, `
            UPDATE payments 
            SET payment_method_id = (
                SELECT id FROM payment_methods WHERE code = payments.payment_method
            )
            WHERE payment_method_id IS NULL
        `);

        // Handle any unmapped (legacy or invalid) - default to 'cash' (id 1 usually) or keep null?
        // Let's check if any are null
        const unmapped = await get(db, "SELECT COUNT(*) as count FROM payments WHERE payment_method_id IS NULL");
        if (unmapped.count > 0) {
            console.warn(`⚠️ Warning: ${unmapped.count} payments could not be mapped. Defaulting to 'cash' (ID 1).`);
            const cash = await get(db, "SELECT id FROM payment_methods WHERE code = 'cash'");
            if (cash) {
                await run(db, "UPDATE payments SET payment_method_id = ? WHERE payment_method_id IS NULL", [cash.id]);
            }
        }

        // 5. Recreate Payments Table (Schema Change)
        console.log('🏗️ Recreating payments table with Foreign Key...');

        await run(db, "PRAGMA foreign_keys = OFF");

        await run(db, "ALTER TABLE payments RENAME TO payments_old_refactor");

        // New Schema (Based on audit + implementation plan)
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
            is_accountable INTEGER DEFAULT 1,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        )`);

        // Copy Data
        console.log('📋 Copying data to new table...');
        await run(db, `
            INSERT INTO payments (
                id, booking_id, payment_date, amount, payment_method_id, 
                reference_number, notes, has_gst, gst_percentage, 
                gst_amount, is_accountable, created_by, created_at
            )
            SELECT 
                id, booking_id, payment_date, amount, payment_method_id, 
                reference_number, notes, has_gst, gst_percentage, 
                gst_amount, is_accountable, created_by, created_at
            FROM payments_old_refactor
        `);

        // Drop Old Table
        await run(db, "DROP TABLE payments_old_refactor");

        await run(db, "PRAGMA foreign_keys = ON");

        console.log('✅ Migration Completed Successfully!');

    } catch (error) {
        console.error('❌ Migration Failed:', error);
    } finally {
        db.close();
    }
}

migrate();
