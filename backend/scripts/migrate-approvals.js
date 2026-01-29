const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/erp.db');
const db = new sqlite3.Database(dbPath);

const migrate = () => {
    db.serialize(() => {
        console.log('🛡️ Starting Approval System Migration...');

        // 1. Create approvals table
        db.run(`
            CREATE TABLE IF NOT EXISTS approvals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entity_type TEXT NOT NULL CHECK(entity_type IN ('purchase_order', 'expense')),
                entity_id INTEGER NOT NULL,
                requester_id INTEGER NOT NULL,
                status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
                request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                action_date DATETIME,
                actioned_by INTEGER, -- user_id
                comments TEXT,
                amount DECIMAL(10, 2), -- Snapshot of amount for quick view
                FOREIGN KEY (requester_id) REFERENCES users(id),
                FOREIGN KEY (actioned_by) REFERENCES users(id)
            )
        `, (err) => {
            if (err) console.error('Error creating approvals table:', err.message);
            else console.log('✅ Created approvals table');
        });

        // 2. Index for fast lookups
        db.run(`CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status)`, (err) => { });
        db.run(`CREATE INDEX IF NOT EXISTS idx_approvals_entity ON approvals(entity_type, entity_id)`, (err) => { });
    });
};

migrate();

setTimeout(() => {
    db.close((err) => {
        if (err) console.error(err.message);
        else console.log('🏁 Migration complete.');
    });
}, 2000);
