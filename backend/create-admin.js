// Script to create admin user with proper password hash
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'erp.db');
const db = new sqlite3.Database(dbPath);

const createAdminUser = async () => {
    try {
        // Generate proper bcrypt hash for 'admin123'
        const password = 'admin123';
        const hash = await bcrypt.hash(password, 10);

        console.log('Generated hash for password "admin123":', hash);

        // Delete existing admin user
        db.run('DELETE FROM users WHERE username = ?', ['admin'], (err) => {
            if (err) {
                console.error('Error deleting old admin:', err);
                return;
            }

            console.log('Deleted old admin user');

            // Insert new admin user with proper hash
            db.run(
                'INSERT INTO users (id, name, username, password, role, active) VALUES (?, ?, ?, ?, ?, ?)',
                [1, 'Admin User', 'admin', hash, 'ADMIN', 1],
                (err) => {
                    if (err) {
                        console.error('Error creating admin user:', err);
                    } else {
                        console.log('✅ Admin user created successfully!');
                        console.log('Username: admin');
                        console.log('Password: admin123');

                        // Verify the user was created
                        db.get('SELECT id, username, role FROM users WHERE username = ?', ['admin'], (err, row) => {
                            if (err) {
                                console.error('Error verifying user:', err);
                            } else {
                                console.log('Verified user in database:', row);
                            }
                            db.close();
                        });
                    }
                }
            );
        });
    } catch (error) {
        console.error('Error:', error);
        db.close();
    }
};

createAdminUser();
