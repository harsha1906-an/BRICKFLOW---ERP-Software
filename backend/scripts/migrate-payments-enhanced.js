const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/erp.db');
const db = new sqlite3.Database(dbPath);

const migrate = () => {
    db.serialize(() => {
        console.log('💰 Starting Enhanced Payments Migration...');

        // 1. Customer Loans Table (Tracking customer's bank loans)
        db.run(`
            CREATE TABLE IF NOT EXISTS customer_loans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                booking_id INTEGER NOT NULL,
                bank_name TEXT NOT NULL,
                loan_account_number TEXT,
                sanctioned_amount DECIMAL(12, 2) NOT NULL,
                disbursed_amount DECIMAL(12, 2) DEFAULT 0,
                status TEXT DEFAULT 'active' CHECK(status IN ('pending', 'active', 'closed')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (booking_id) REFERENCES bookings(id)
            )
        `, (err) => {
            if (err) console.error('Error creating customer_loans:', err.message);
            else console.log('✅ Created customer_loans table');
        });

        // 2. Payment Schedules (For EMIs or Construction Linked Plans)
        db.run(`
            CREATE TABLE IF NOT EXISTS payment_schedules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                booking_id INTEGER NOT NULL,
                due_date DATE NOT NULL,
                amount DECIMAL(12, 2) NOT NULL,
                description TEXT, -- e.g., "EMI #1", "Plinth Level"
                status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'overdue', 'partially_paid')),
                paid_amount DECIMAL(12, 2) DEFAULT 0,
                FOREIGN KEY (booking_id) REFERENCES bookings(id)
            )
        `, (err) => {
            if (err) console.error('Error creating payment_schedules:', err.message);
            else console.log('✅ Created payment_schedules table');
        });

        // 3. Update Bookings table to include payment_plan type? 
        // SQLite doesn't support easy column addition with ENUM constraints in one go, 
        // but we can add simple text columns.
        // We'll skip strict constraint in DB for now and handle in app logic.
        /* 
           ALTER TABLE bookings ADD COLUMN payment_plan TEXT DEFAULT 'standard';
        */
        // Check if column exists commonly done by checking pragma or just try-catch.
        // For simplicity in this script, we'll try to add it.
        db.run(`ALTER TABLE bookings ADD COLUMN payment_plan TEXT DEFAULT 'standard'`, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.error('Error adding payment_plan to bookings:', err.message);
            } else {
                console.log('✅ Added payment_plan column to bookings (or already exists)');
            }
        });

        // 4. Update Payments table to link to a schedule?
        db.run(`ALTER TABLE payments ADD COLUMN schedule_id INTEGER REFERENCES payment_schedules(id)`, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.error('Error adding schedule_id to payments:', err.message);
            } else {
                console.log('✅ Added schedule_id column to payments');
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
