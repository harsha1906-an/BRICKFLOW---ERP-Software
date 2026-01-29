const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/erp.db');
const db = new sqlite3.Database(dbPath);

const migrate = () => {
    db.serialize(() => {
        console.log('📦 Starting Phase 2 Migration: Customer Analytics...');

        // 1. Create customer_visits table
        db.run(`
            CREATE TABLE IF NOT EXISTS customer_visits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                visit_date DATE NOT NULL,
                visit_type TEXT DEFAULT 'walk-in', -- walk-in, scheduled, follow-up
                project_id INTEGER,
                unit_id INTEGER,
                budget_min REAL,
                budget_max REAL,
                source TEXT, -- reference, advertisement, website, etc.
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id),
                FOREIGN KEY (project_id) REFERENCES projects(id),
                FOREIGN KEY (unit_id) REFERENCES units(id)
            )
        `, (err) => {
            if (err) console.error('Error creating customer_visits:', err.message);
            else console.log('✅ Created customer_visits table');
        });

        // 2. Create customer_status table
        db.run(`
            CREATE TABLE IF NOT EXISTS customer_status (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                status TEXT NOT NULL, -- new, contacted, interested, negotiating, converted, lost
                status_date DATE NOT NULL,
                follow_up_date DATE,
                priority TEXT DEFAULT 'medium', -- high, medium, low
                assigned_to TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id)
            )
        `, (err) => {
            if (err) console.error('Error creating customer_status:', err.message);
            else console.log('✅ Created customer_status table');
        });

        // 3. Create customer_lost_reasons table
        db.run(`
            CREATE TABLE IF NOT EXISTS customer_lost_reasons (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                lost_date DATE NOT NULL,
                reason TEXT NOT NULL, -- price, location, amenities, financing, competitor, other
                detailed_reason TEXT,
                competitor_name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id)
            )
        `, (err) => {
            if (err) console.error('Error creating customer_lost_reasons:', err.message);
            else console.log('✅ Created customer_lost_reasons table');
        });

        // 4. Alter customers table (Check if columns exist first to avoid error, or just try-catch)
        // SQLite doesn't support IF NOT EXISTS for columns easily in one statement.
        // We'll wrap in try/catch or just run it and ignore specific errors.

        const alterQueries = [
            "ALTER TABLE customers ADD COLUMN current_status TEXT DEFAULT 'new'",
            "ALTER TABLE customers ADD COLUMN source TEXT",
            "ALTER TABLE customers ADD COLUMN assigned_to TEXT"
        ];

        alterQueries.forEach(query => {
            db.run(query, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    console.error('Error altering table:', err.message);
                } else if (!err) {
                    console.log(`✅ Executed: ${query}`);
                } else {
                    console.log(`ℹ️  Column already exists (skipped): ${query}`);
                }
            });
        });
    });
};

migrate();
// Close connection after a small delay to ensure all queries run
setTimeout(() => {
    db.close((err) => {
        if (err) console.error(err.message);
        else console.log('🏁 Migration complete.');
    });
}, 2000);
