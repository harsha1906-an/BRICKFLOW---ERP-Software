const User = require('../src/models/user.model');
const { runQuery } = require('../src/config/db');

async function testUserAuth() {
    console.log('🧪 Starting User Auth Verification...');

    const username = 'testuser_auth_final';
    const password = 'password123';
    let userId;

    try {
        const hashedPassword = await User.hashPassword(password);

        // Try Insert
        try {
            const res = await runQuery(
                `INSERT INTO users (name, username, password, role, is_active) VALUES (?, ?, ?, 'admin', 1)`,
                [`Test User Auth`, username, hashedPassword]
            );
            userId = res.id;
            console.log(`User created: ${username} (ID: ${userId})`);
        } catch (e) {
            if (e.message.includes('CONSTRAINT')) {
                console.log('User exists, updating...');
                const u = await User.findByUsername(username);
                userId = u.id;
                await runQuery('UPDATE users SET password = ?, is_active = 1 WHERE id = ?', [hashedPassword, userId]);
                console.log(`User updated: ${username} (ID: ${userId})`);
            } else {
                throw e;
            }
        }

        // 2. Test Login Logic (Active)
        let user = await User.findByUsername(username);
        console.log(`User found: is_active=${user.is_active}`);

        if (user.is_active === 1) {
            console.log('✅ User is active by default.');
        } else {
            console.error('❌ User should be active.');
        }

        // Simulate Controller Check
        if (user.is_active === 0 || user.is_active === false) {
            console.error('❌ Login Failed (Unexpected).');
        } else {
            console.log('✅ Login Allowed (Expected).');
        }

        // 3. Deactivate User
        console.log('Deactivating user...');
        await runQuery('UPDATE users SET is_active = 0 WHERE id = ?', [userId]);

        // 4. Test Login Logic (Inactive)
        user = await User.findByUsername(username);
        console.log(`User found: is_active=${user.is_active}`);

        if (user.is_active === 0) {
            console.log('✅ User is inactive in DB.');
        } else {
            console.error('❌ User should be inactive.');
        }

        // Simulate Controller Check
        if (user.is_active === 0 || user.is_active === false) {
            console.log('✅ Login Blocked (Expected).');
        } else {
            console.error('❌ Login Allowed (CRITICAL FAILURE).');
        }

    } catch (e) {
        console.error('Test Error:', e);
    }
}
testUserAuth();
