const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

console.log('📝 Adding notifications table to existing database...\n');

const createTableSQL = `
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN (
    'purchase_approval', 'expense_approval', 'payment_approval',
    'inventory_restock', 'payment_received', 'booking_created',
    'low_stock_alert', 'project_milestone', 'general'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id INTEGER,
  related_type TEXT CHECK(related_type IN ('purchase', 'expense', 'payment', 'inventory', 'booking', 'project')),
  action_url TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`;

const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);',
    'CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);',
    'CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);'
];

db.serialize(() => {
    // Create table
    db.run(createTableSQL, (err) => {
        if (err) {
            console.error('❌ Error creating table:', err.message);
            return;
        }
        console.log('✅ Notifications table created successfully');

        // Create indexes
        indexes.forEach((indexSQL, i) => {
            db.run(indexSQL, (err) => {
                if (err) {
                    console.error(`❌ Error creating index ${i + 1}:`, err.message);
                } else {
                    console.log(`✅ Index ${i + 1} created successfully`);
                }
            });
        });

        // Verify table exists
        db.get("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='notifications'", (err, row) => {
            if (err) {
                console.error('❌ Error verifying table:', err.message);
            } else if (row.count === 1) {
                console.log('\n✅ Table verified - notifications table exists!');

                // Insert a test notification
                db.run(
                    `INSERT INTO notifications (user_id, type, title, message, action_url) VALUES (?, ?, ?, ?, ?)`,
                    [1, 'general', 'System Ready', 'Notification system is now active!', '/dashboard'],
                    function (err) {
                        if (err) {
                            console.error('❌ Error inserting test notification:', err.message);
                        } else {
                            console.log('✅ Test notification inserted (ID:', this.lastID, ')');

                            // Query it back
                            db.get('SELECT * FROM notifications WHERE id = ?', [this.lastID], (err, row) => {
                                if (err) {
                                    console.error('❌ Error reading notification:', err.message);
                                } else {
                                    console.log('\n📬 Test Notification:');
                                    console.log('   Title:', row.title);
                                    console.log('   Message:', row.message);
                                    console.log('   Type:', row.type);
                                    console.log('   User ID:', row.user_id);
                                    console.log('   Created:', row.created_at);
                                    console.log('\n🎉 Notification system is ready to use!');
                                }
                                db.close();
                            });
                        }
                    }
                );
            } else {
                console.log('\n❌ Table not found after creation');
                db.close();
            }
        });
    });
});
