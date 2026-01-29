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

async function cleanup() {
    console.log('🚀 Starting Phase 5: Data Cleanup...');

    try {
        // Find corrupted rows (NON_ACCOUNTABLE but gst_amount > 0)
        const corrupted = await get(db, `
            SELECT COUNT(*) as count 
            FROM payments 
            WHERE accounting_type = 'NON_ACCOUNTABLE' AND gst_amount > 0
        `);

        console.log(`🔎 Found ${corrupted.count} corrupted rows.`);

        if (corrupted.count > 0) {
            // Fix them
            await run(db, `
                UPDATE payments 
                SET gst_amount = 0 
                WHERE accounting_type = 'NON_ACCOUNTABLE' AND gst_amount > 0
            `);
            console.log(`✅ Fixed ${corrupted.count} rows.`);
        } else {
            console.log('✅ No corruption found.');
        }

    } catch (error) {
        console.error('❌ Cleanup Failed:', error);
    } finally {
        db.close();
    }
}

cleanup();
