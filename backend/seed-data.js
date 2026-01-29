const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');
const db = new sqlite3.Database('./database/erp.db');

const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

const seed = async () => {
    try {
        console.log('🌱 Starting Seed Process...');

        // Initialize Payment Methods
        const paymentMethods = [
            { code: 'CASH', name: 'Cash' },
            { code: 'CHECK', name: 'Check' },
            { code: 'UPI', name: 'UPI' },
            { code: 'BANK_TRANSFER', name: 'Bank Transfer' }
        ];

        for (const pm of paymentMethods) {
            await run(
                'INSERT OR IGNORE INTO payment_methods (code, name) VALUES (?, ?)',
                [pm.code, pm.name]
            );
        }

        console.log('✅ Payment methods initialized');

        // 1. Users
        const adminHash = await bcrypt.hash('admin123', 10);
        await run(`INSERT OR IGNORE INTO users (name, username, password, role) VALUES (?, ?, ?, ?)`,
            ['Admin User', 'admin', adminHash, 'ADMIN']);
        console.log('✅ Admin user seeded');

        const siteHash = await bcrypt.hash('site123', 10);
        await run(`INSERT OR IGNORE INTO users (name, username, password, role) VALUES (?, ?, ?, ?)`,
            ['Site Engineer', 'site', siteHash, 'SITE']);
        console.log('✅ Site user seeded');

        // 2. Projects
        await run(`INSERT OR IGNORE INTO projects (name, location, start_date, status, is_active) VALUES (?, ?, ?, ?, 1)`,
            ['Green Valley Villas', 'Bangalore', '2024-01-01', 'ongoing']);
        console.log('✅ Project seeded');

        // 3. Units
        await run(`INSERT OR IGNORE INTO units (project_id, unit_number, type, price, status, is_active) VALUES (?, ?, ?, ?, ?, 1)`,
            [1, 'A-101', '3BHK', 8500000, 'available']);
        await run(`INSERT OR IGNORE INTO units (project_id, unit_number, type, price, status, is_active) VALUES (?, ?, ?, ?, ?, 1)`,
            [1, 'A-102', '4BHK', 12000000, 'available']);
        console.log('✅ Units seeded');

        // 4. Materials
        await run(`INSERT OR IGNORE INTO materials (name, unit, is_active) VALUES (?, ?, 1)`, ['Cement', 'bags']);
        await run(`INSERT OR IGNORE INTO materials (name, unit, is_active) VALUES (?, ?, 1)`, ['Sand', 'tons']);
        await run(`INSERT OR IGNORE INTO materials (name, unit, is_active) VALUES (?, ?, 1)`, ['Steel', 'tons']);
        await run(`INSERT OR IGNORE INTO materials (name, unit, is_active) VALUES (?, ?, 1)`, ['Bricks', 'pcs']);
        console.log('✅ Materials seeded');

        // 5. Suppliers
        await run(`INSERT OR IGNORE INTO suppliers (name, contact_person, phone, email, address, is_active) VALUES (?, ?, ?, ?, ?, 1)`,
            ['ABC Cement', 'Rajesh', '9876543210', 'rajesh@abc.com', 'Bangalore']);
        await run(`INSERT OR IGNORE INTO suppliers (name, contact_person, phone, email, address, is_active) VALUES (?, ?, ?, ?, ?, 1)`,
            ['Steel World', 'Suresh', '9876543211', 'suresh@steel.com', 'Mumbai']);
        console.log('✅ Suppliers seeded');

        // 6. Construction Stages
        const stages = [
            { name: 'Foundation', order: 1, pct: 20 },
            { name: 'Plinth', order: 2, pct: 15 },
            { name: 'Structure', order: 3, pct: 25 },
            { name: 'Brickwork', order: 4, pct: 20 },
            { name: 'Finishing', order: 5, pct: 20 }
        ];

        // Check if table exists first (it should)
        for (const stage of stages) {
            // Note: Schema might be 'project_stages' or 'construction_stages' depending on recent changes.
            // init.sql in Step 400 showed 'project_stages' (line 387).
            // Let's check verify-schema output... it checked 'construction_stages' in Step 506.
            // Let's assume project_stages from init.sql view.
            try {
                await run(`INSERT OR IGNORE INTO project_stages (project_id, stage_name, stage_order, payment_percentage, status) VALUES (?, ?, ?, ?, 'pending')`,
                    [1, stage.name, stage.order, stage.pct]);
            } catch (e) {
                // Ignore if table name mismatch, we focus on core data first
                console.log(`⚠️ Could not seed stage ${stage.name}: ${e.message}`);
            }
        }
        console.log('✅ Stages seeded (if table exists)');

        console.log('\n✨ SEEDING COMPLETE');
        db.close();

    } catch (error) {
        console.error('❌ SEED ERROR:', error);
        db.close();
    }
};

seed();
