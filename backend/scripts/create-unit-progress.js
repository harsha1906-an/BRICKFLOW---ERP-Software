const { runQuery, getAll } = require('../src/config/db');

async function createConstructionProgressSchema() {
    try {
        console.log('🏗️  Creating Construction Progress Schema...\n');

        // 1. Create construction_stages table
        console.log('Creating construction_stages table...');
        await runQuery(`
            CREATE TABLE IF NOT EXISTS construction_stages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                default_percentage REAL NOT NULL CHECK(default_percentage > 0 AND default_percentage <= 100),
                stage_order INTEGER NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Seed construction stages
        console.log('Seeding construction stages...');
        const stages = [
            ['Foundation', 10, 1],
            ['Plinth', 10, 2],
            ['Lintel', 10, 3],
            ['Slab', 15, 4],
            ['Brick Work', 10, 5],
            ['Plastering', 10, 6],
            ['Flooring', 10, 7],
            ['Painting', 10, 8],
            ['Electrical', 5, 9],
            ['Plumbing', 5, 10],
            ['Finishing', 5, 11]
        ];

        for (const [name, percentage, order] of stages) {
            await runQuery(
                `INSERT OR IGNORE INTO construction_stages (name, default_percentage, stage_order) VALUES (?, ?, ?)`,
                [name, percentage, order]
            );
        }

        // Verify total percentage = 100%
        const total = await runQuery('SELECT SUM(default_percentage) as total FROM construction_stages');
        console.log(`✅ Total stage percentage: ${total.total}%`);

        // 3. Create unit_progress table
        console.log('Creating unit_progress table...');
        await runQuery(`
            CREATE TABLE IF NOT EXISTS unit_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                unit_id INTEGER NOT NULL,
                stage_id INTEGER NOT NULL,
                status TEXT DEFAULT 'NOT_STARTED' CHECK(status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
                started_on DATE,
                completed_on DATE,
                verified_by INTEGER,
                remarks TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (unit_id) REFERENCES units(id),
                FOREIGN KEY (stage_id) REFERENCES construction_stages(id),
                FOREIGN KEY (verified_by) REFERENCES users(id),
                UNIQUE(unit_id, stage_id),
                CHECK(completed_on IS NULL OR status = 'COMPLETED')
            )
        `);

        console.log('\n✅ Schema created successfully!');
        console.log('\n📊 Verifying schema...');

        // Verify tables exist
        const tables = await getAll("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('construction_stages', 'unit_progress')");
        console.log(`Found tables: ${tables.map(t => t.name).join(', ')}`);

        // Show stages
        const stageList = await getAll('SELECT name, default_percentage, stage_order FROM construction_stages ORDER BY stage_order');
        console.log('\n📋 Construction Stages:');
        stageList.forEach(s => {
            console.log(`  ${s.stage_order}. ${s.name} (${s.default_percentage}%)`);
        });

        console.log('\n🎉 Migration complete!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

createConstructionProgressSchema();
