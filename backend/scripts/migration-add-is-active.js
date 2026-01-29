const { runQuery } = require('../src/config/db');

async function migrate() {
    console.log('🔄 Starting Soft Delete Migration...');
    const tables = ['projects', 'units', 'customers', 'suppliers', 'materials', 'labours', 'users'];

    for (const t of tables) {
        try {
            console.log(`Migrating ${t}...`);
            // Check if column exists first to avoid error (though idempotent scripts are better)
            // But strict ALTER TABLE fails if exists.
            // We'll wrap in try-catch.
            await runQuery(`ALTER TABLE ${t} ADD COLUMN is_active INTEGER DEFAULT 1`);
            console.log(`✅ Added is_active to ${t}`);
        } catch (e) {
            if (e.message.includes('duplicate column')) {
                console.log(`ℹ️ is_active already exists in ${t}`);
            } else {
                console.error(`❌ Failed ${t}:`, e.message);
            }
        }
    }
    console.log('🎉 Migration Complete');
}

migrate();
