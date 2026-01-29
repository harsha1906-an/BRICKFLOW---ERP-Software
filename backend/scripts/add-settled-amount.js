const { runQuery, getAll } = require('../src/config/db');

async function migrate() {
    try {
        console.log('--- Migrating labour_payments: Adding settled_amount ---');

        // Check if column exists
        const cols = await getAll("PRAGMA table_info(labour_payments)");
        const hasSettled = cols.some(c => c.name === 'settled_amount');

        if (!hasSettled) {
            await runQuery("ALTER TABLE labour_payments ADD COLUMN settled_amount REAL DEFAULT 0");
            console.log('✅ Added settled_amount column.');
        } else {
            console.log('ℹ️ settled_amount column already exists.');
        }

    } catch (e) {
        console.error('❌ Migration Failed:', e);
    }
}

migrate();
