const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../database/erp.db');

const db = new sqlite3.Database(dbPath);

console.log('🚀 Starting Schema Verification (Direct DB)...');

db.serialize(() => {
    // 1. Check Payments Columns
    db.all("PRAGMA table_info(payments)", (err, cols) => {
        if (err) {
            console.error('❌ Failed to get payments schema:', err.message);
            return;
        }
        const colNames = cols.map(c => c.name);
        console.log('📄 Payments Columns:', colNames.join(', '));

        if (colNames.includes('created_by')) console.log('✅ Payments table has created_by');
        else console.error('❌ Payments table MISSING created_by');

        if (colNames.includes('payment_method')) console.log('✅ Payments table has payment_method');
    });

    // 2. Check Constraint for 'loan'
    // We try to insert a dummy payment with 'loan' directly.
    console.log('\nTesting "loan" constraint directly...');
    const testSql = `
        INSERT INTO payments (booking_id, payment_date, amount, payment_method, created_by)
        VALUES (99999, '2023-01-01', 100, 'loan', 1)
    `;
    // Note: 99999 booking_id might fail FK constraint if enabled.
    // We toggle FK off for this test to strictly test the CHECK constraint on payment_method

    db.run("PRAGMA foreign_keys = OFF");
    db.run(testSql, function (err) {
        if (err) {
            console.error('❌ Insert "loan" failed:', err.message);
            if (err.message.includes('CHECK constraint')) {
                console.error('   (Confirmation: The CHECK constraint still forbids "loan")');
            } else {
                console.log('   (Error might be unrelated to check constraint)');
            }
        } else {
            console.log('✅ Insert with payment_method="loan" SUCCEEDED! (Constraint updated)');
            // Clean up
            db.run(`DELETE FROM payments WHERE id = ${this.lastID}`);
        }
        db.run("PRAGMA foreign_keys = ON");
    });

    // 3. Check Purchases Columns
    db.all("PRAGMA table_info(purchases)", (err, cols) => {
        const colNames = cols.map(c => c.name);
        if (colNames.includes('created_by')) console.log('✅ Purchases table has created_by');
        else console.error('❌ Purchases table MISSING created_by');
    });

    // 4. Check Labour Attendance Columns
    db.all("PRAGMA table_info(labour_attendance)", (err, cols) => {
        const colNames = cols.map(c => c.name);
        if (colNames.includes('substitute_labour_id')) console.log('✅ Labour Attendance has substitute_labour_id');
        else console.error('❌ Labour Attendance MISSING substitute_labour_id');
    });

    // 5. Check Audit Logs existence
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='audit_logs'", (err, rows) => {
        if (rows.length > 0) console.log('✅ audit_logs table exists');
        else console.error('❌ audit_logs table MISSING');
    });

    db.close();
});
