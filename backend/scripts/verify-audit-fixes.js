const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const axios = require('axios');
const dbPath = path.resolve(__dirname, '../database/erp.db');

const db = new sqlite3.Database(dbPath);
const API_URL = 'http://localhost:5001/api';

// Helper for DB queries
const get = (sql, params = []) => new Promise((resolve, reject) => db.get(sql, params, (err, row) => err ? reject(err) : resolve(row)));

let authToken = '';
let userId = '';

async function loginOrRegister() {
    try {
        const uniqueUser = 'auditor' + Date.now();
        console.log(`🔑 Registering fresh user: ${uniqueUser}...`);

        // Register fresh user
        try {
            await axios.post(`${API_URL}/auth/register`, {
                username: uniqueUser,
                password: 'Test@1234',
                role: 'admin',
                name: 'Auditor Bot'
            });
            console.log('✅ Registration successful.');
        } catch (regErr) {
            console.error('❌ Registration Failed:', regErr.response?.data || regErr.message);
            // If this fails, we can't proceed really, but maybe we can try login if it says "taken"
            throw regErr;
        }

        // Login
        const res = await axios.post(`${API_URL}/auth/login`, {
            username: uniqueUser,
            password: 'Test@1234'
        });
        authToken = res.data.token;
        userId = res.data.user.id;
        console.log(`✅ Login Successful. User ID: ${userId}`);

    } catch (error) {
        console.error('❌ FATAL: Auth failed.', error.response?.data || error.message);
        process.exit(1);
    }
}

async function verifyAuditFixes() {
    console.log('🚀 Starting Verification of Audit Fixes...');
    await loginOrRegister();

    const headers = { Authorization: `Bearer ${authToken}` };

    try {
        // 1. Verify Payment Mode 'Loan' (Database Constraint Fix)
        console.log('\nTesting Payment Mode "Loan"...');

        let booking = await get('SELECT id FROM bookings LIMIT 1');

        if (!booking) {
            console.log('⚠️ No booking found. Skipping Payment test.');
        } else {
            try {
                const res = await axios.post(`${API_URL}/payments`, {
                    booking_id: booking.id,
                    payment_date: '2023-11-20',
                    amount: 500,
                    payment_method: 'loan',
                    reference_number: 'LOAN-TEST-001',
                    notes: 'Audit Fix Verification'
                }, { headers });
                console.log('✅ Payment with mode "loan" created! ID:', res.data.data.id);

                const pymt = await get('SELECT created_by FROM payments WHERE id = ?', [res.data.data.id]);
                if (pymt && pymt.created_by == userId) console.log('✅ Payment tracks created_by correctly.');
                else console.error('❌ Payment created_by mismatch or missing:', pymt);

            } catch (e) {
                console.error('❌ Payment with "loan" failed:', e.response?.data || e.message);
            }
        }

        // 2. Verify Purchase Accountability
        console.log('\nTesting Purchase Accountability...');
        let supplier = await get('SELECT id FROM suppliers LIMIT 1');
        if (!supplier) console.log('⚠️ No suppliers found, skipping purchase test.');
        else {
            const purchaseRes = await axios.post(`${API_URL}/purchases`, {
                supplier_id: supplier.id,
                purchase_date: '2023-11-20',
                total_amount: 1000,
                notes: 'Audit Verify',
                items: [{ material_id: 1, quantity: 10, rate: 100, amount: 1000 }]
            }, { headers });
            console.log('✅ Purchase created. ID:', purchaseRes.data.data.id);

            const purchParams = await get('SELECT created_by FROM purchases WHERE id = ?', [purchaseRes.data.data.id]);
            if (purchParams && purchParams.created_by == userId) console.log('✅ Purchase tracks created_by correctly.');
            else console.error('❌ Purchase created_by mismatch:', purchParams);

            // 3. Verify PO Approval Workflow Hook
            console.log('\nTesting PO Approval Workflow Hook...');
            try {
                await axios.put(`${API_URL}/purchases/${purchaseRes.data.data.id}/confirm`, {}, { headers });
                console.log('✅ Purchase Confirmed.');

                // Using db query to check approvals as entity_type="purchase_order"
                const approval = await get('SELECT * FROM approvals WHERE entity_type="purchase_order" AND entity_id=?', [purchaseRes.data.data.id]);
                if (approval) console.log('✅ Approval record found in approvals table!');
                else console.error('❌ Approval record MISSING in approvals table.');

            } catch (e) {
                console.error('❌ Purchase confirm failed:', e.response?.data || e.message);
            }
        }

        // 4. Verify Project Update Audit Log
        console.log('\nTesting Project Audit Log...');
        let project = await get('SELECT id, name FROM projects LIMIT 1');
        if (project) {
            const newName = project.name + ' (Updated)';
            await axios.put(`${API_URL}/projects/${project.id}`, {
                name: newName,
                location: 'Test Loc',
                start_date: '2023-01-01',
                status: 'ongoing'
            }, { headers });
            console.log('✅ Project Updated.');

            const log = await get('SELECT * FROM audit_logs WHERE entity_type="projects" AND entity_id=? ORDER BY id DESC LIMIT 1', [project.id]);
            if (log) {
                console.log('✅ Audit Log found!');
                console.log('   Action:', log.action);
                if (log.user_id == userId) console.log('   User ID matches.');
                else console.log('   User ID mismatch (Expected ' + userId + ', got ' + log.user_id + ')');
            } else {
                console.error('❌ Audit Log MISSING for Project update.');
            }
        }

        console.log('\n🎉 ALL VERIFICATION TESTS COMPLETED.');

    } catch (error) {
        console.error('❌ Verification Script Error:', error);
    } finally {
        db.close();
    }
}

verifyAuditFixes();
