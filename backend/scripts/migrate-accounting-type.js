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

async function migrate() {
    console.log('🚀 Starting Phase 1: Accounting Type Migration...');

    try {
        // 1. Add new column accounting_type
        console.log('🔧 Adding accounting_type column...');
        try {
            await run(db, "ALTER TABLE payments ADD COLUMN accounting_type TEXT");
        } catch (e) {
            if (!e.message.includes('duplicate column')) throw e;
            console.log('   Column accounting_type already exists, skipping add.');
        }

        // 2. Migrate existing data
        console.log('🔄 Migrating data (is_accountable -> accounting_type)...');
        await run(db, `
            UPDATE payments 
            SET accounting_type = CASE 
                WHEN is_accountable = 1 THEN 'ACCOUNTABLE' 
                ELSE 'NON_ACCOUNTABLE' 
            END
            WHERE accounting_type IS NULL
        `);

        // 3. Enforce constraints (SQLite doesn't support adding NOT NULL to existing column easily without default, 
        // but we just filled it. We will enforce it properly in Phase 6 when we recreate table/drop column. 
        // For now, let's verify no NULLs remain.)

        const check = await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as count FROM payments WHERE accounting_type IS NULL", (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (check.count > 0) {
            throw new Error(`Migration Failed: ${check.count} rows have NULL accounting_type`);
        }

        console.log('✅ Phase 1 Migration Completed Successfully!');
        console.log('   - accounting_type column added');
        console.log('   - Data migrated from is_accountable');

    } catch (error) {
        console.error('❌ Migration Failed:', error);
        process.exit(1);
    } finally {
        db.close();
    }
}

migrate();
