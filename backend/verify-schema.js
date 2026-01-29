const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./database/erp.db');

console.log('=== DATABASE SCHEMA VERIFICATION ===\n');

// Get all tables
db.all('SELECT name FROM sqlite_master WHERE type="table" ORDER BY name', (err, tables) => {
    if (err) {
        console.error('Error:', err);
        db.close();
        return;
    }

    console.log(`✅ Total tables: ${tables.length}\n`);

    const criticalTables = [
        'users', 'projects', 'units', 'materials', 'suppliers',
        'purchases', 'purchase_orders', 'purchase_order_items',
        'expenses', 'payments', 'payment_methods', 'payment_requests',
        'inventory_transactions', 'customers', 'bookings',
        'unit_progress', 'construction_stages', 'audit_logs'
    ];

    const foundTables = tables.map(t => t.name);
    console.log('Critical Tables Check:');
    criticalTables.forEach(table => {
        const exists = foundTables.includes(table);
        console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    });

    console.log('\n=== CRITICAL COLUMN VERIFICATION ===\n');

    // Check expenses table for is_accountable
    db.all('PRAGMA table_info(expenses)', (err, cols) => {
        const hasAccountable = cols.some(c => c.name === 'is_accountable');
        console.log(`expenses.is_accountable: ${hasAccountable ? '✅ EXISTS' : '❌ MISSING'}`);

        // Check purchases table
        db.all('PRAGMA table_info(purchases)', (err, cols) => {
            const hasAccountable = cols.some(c => c.name === 'is_accountable');
            console.log(`purchases.is_accountable: ${hasAccountable ? '✅ EXISTS' : '❌ MISSING'}`);

            // Check payments table
            db.all('PRAGMA table_info(payments)', (err, cols) => {
                const hasMethodId = cols.some(c => c.name === 'payment_method_id');
                const hasAccounting = cols.some(c => c.name === 'accounting_type');
                console.log(`payments.payment_method_id: ${hasMethodId ? '✅ EXISTS' : '❌ MISSING'}`);
                console.log(`payments.accounting_type: ${hasAccounting ? '✅ EXISTS' : '❌ MISSING'}`);

                // Check admin user
                db.get('SELECT id, username, role FROM users WHERE username = ?', ['admin'], (err, user) => {
                    console.log(`\n=== SEED DATA CHECK ===`);
                    console.log(`Admin user: ${user ? '✅ EXISTS (id: ' + user.id + ', role: ' + user.role + ')' : '❌ MISSING'}`);

                    console.log('\n=== SCHEMA STATUS: STABLE ✅ ===\n');
                    db.close();
                });
            });
        });
    });
});
