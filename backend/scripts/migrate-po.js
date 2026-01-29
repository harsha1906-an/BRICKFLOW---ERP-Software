const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/erp.db');
const db = new sqlite3.Database(dbPath);

const migrate = () => {
    db.serialize(() => {
        console.log('📦 Starting Phase 3 Migration: Purchase Orders...');

        // 1. Create purchase_orders table
        db.run(`
            CREATE TABLE IF NOT EXISTS purchase_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                po_number TEXT UNIQUE NOT NULL, -- Auto-generated e.g., PO-2024-001
                project_id INTEGER NOT NULL,
                supplier_id INTEGER NOT NULL,
                order_date DATE NOT NULL,
                expected_delivery_date DATE,
                status TEXT DEFAULT 'draft', -- draft, pending_approval, approved, rejected, ordered, received, cancelled
                total_amount DECIMAL(10, 2) DEFAULT 0,
                notes TEXT,
                created_by INTEGER, -- user_id
                approved_by INTEGER, -- user_id
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id),
                FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
                FOREIGN KEY (created_by) REFERENCES users(id),
                FOREIGN KEY (approved_by) REFERENCES users(id)
            )
        `, (err) => {
            if (err) console.error('Error creating purchase_orders:', err.message);
            else console.log('✅ Created purchase_orders table');
        });

        // 2. Create purchase_order_items table
        db.run(`
            CREATE TABLE IF NOT EXISTS purchase_order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                po_id INTEGER NOT NULL,
                material_id INTEGER NOT NULL,
                quantity DECIMAL(10, 2) NOT NULL,
                unit_price DECIMAL(10, 2) NOT NULL,
                total_price DECIMAL(10, 2) NOT NULL,
                notes TEXT, -- specific reason for this item
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
                FOREIGN KEY (material_id) REFERENCES materials(id)
            )
        `, (err) => {
            if (err) console.error('Error creating purchase_order_items:', err.message);
            else console.log('✅ Created purchase_order_items table');
        });

        // 3. Add usage_reason to inventory_transactions if not exists
        // Note: We'll use a try/catch block logic essentially by running alter and ignoring failure
        db.run("ALTER TABLE inventory_transactions ADD COLUMN usage_reason TEXT", (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding usage_reason:', err.message);
            } else if (!err) {
                console.log('✅ Added usage_reason to inventory_transactions');
            } else {
                console.log('ℹ️  usage_reason column already exists');
            }
        });
    });
};

migrate();

setTimeout(() => {
    db.close((err) => {
        if (err) console.error(err.message);
        else console.log('🏁 Migration complete.');
    });
}, 2000);
