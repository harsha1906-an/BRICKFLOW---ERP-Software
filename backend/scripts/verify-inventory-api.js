const axios = require('axios');
const { runQuery } = require('../src/config/db');

const API_URL = 'http://localhost:5001/api';

async function runApiTest() {
    console.log('🧪 Starting Inventory API Enforcement Verification...');

    // 1. Setup specific test data directly in DB to ensure validity
    const rand = Math.floor(Math.random() * 10000);
    // Added location
    const projId = (await runQuery("INSERT INTO projects (name, location, status, created_by) VALUES (?, 'Test Location', 'ongoing', 1)", [`InvTest-${rand}`])).id;
    // Added category, description, price
    const matId = (await runQuery("INSERT INTO materials (name, unit, category, description, price, created_by) VALUES (?, 'nos', 'Civil', 'Test Desc', 100, 1)", [`Brick-${rand}`])).id;
    // Added email, address
    const suppId = (await runQuery("INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, 'Mr. Test', '1234567890', 'test@example.com', '123 Test St')", [`Supp-${rand}`])).id;

    // Create VALID PO (Draft) - Added expected_delivery_date
    const poNumber = `PO-TEST-${rand}`;
    const poRes = await runQuery(
        "INSERT INTO purchase_orders (po_number, project_id, supplier_id, order_date, expected_delivery_date, status, created_by, total_amount) VALUES (?, ?, ?, '2023-01-01', '2023-01-10', 'draft', 1, 0)",
        [poNumber, projId, suppId]
    );
    const poId = poRes.id;

    console.log(`✅ Setup: Proj ${projId}, Mat ${matId}, PO ${poId} (Draft)`);

    // Helper to call API (assuming no auth for internal test or add auth headers if needed)
    // Note: If auth enabled, we might get 401. Assuming dev env might be open or we simulate.
    // Let's assume we need auth. I'll hack it or try without. 
    // Based on previous contexts, verify-accounting used login.

    // QUICK LOGIN
    let token;
    try {
        // Register/Login temp user
        const creds = { username: `tester${rand}`, password: 'password123', name: 'Tester', role: 'admin' };
        await axios.post(`${API_URL}/auth/register`, creds).catch(() => { }); // Ignore if exists
        const login = await axios.post(`${API_URL}/auth/login`, { username: creds.username, password: creds.password });
        token = login.data.token;
        console.log('✅ Logged in');
    } catch (e) {
        console.log('⚠️ Login failed, trying without token (might fail if protected)');
    }

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // TEST 1: Manual IN (Should be Forbidden 403)
    console.log('\n--- Test 1: Manual Stock IN via API ---');
    try {
        await axios.post(`${API_URL}/inventory/in`, {
            material_id: matId,
            quantity: 10,
            reference_type: 'manual',
            project_id: projId,
            notes: 'Hacking API',
            usage_reason: 'none'
        }, { headers });
        console.log('❌ FAILED: API allowed Manual IN!');
    } catch (e) {
        if (e.response && e.response.status === 403) {
            console.log('✅ SUCCESS: API blocked Manual IN (403 Forbidden).');
        } else {
            console.log(`❓ Unexpected Error: ${e.message} ${e.response?.status}`);
            if (e.response) console.log(e.response.data);
        }
    }

    // TEST 2: Draft PO IN (Should be Bad Request 400)
    console.log('\n--- Test 2: Draft PO Stock IN via API ---');
    try {
        await axios.post(`${API_URL}/inventory/in`, {
            material_id: matId,
            quantity: 10,
            reference_type: 'purchase_order',
            reference_id: poId,
            project_id: projId,
            notes: 'Draft Attempt',
            usage_reason: 'none'
        }, { headers });
        console.log('❌ FAILED: API allowed Draft PO IN!');
    } catch (e) {
        // We expect custom 400 with "must be APPROVED"
        if (e.response && e.response.status === 400 && e.response.data.message.includes('APPROVED')) {
            console.log('✅ SUCCESS: API blocked Draft PO IN.');
        } else {
            console.log(`❓ Unexpected Error: ${e.message} ${e.response?.status}`);
            if (e.response) console.log(e.response.data);
        }
    }

    // TEST 3: Approved PO IN (Should Succeed 201)
    console.log('\n--- Test 3: Approved PO Stock IN via API ---');
    // Force Approve PO via DB
    await runQuery("UPDATE purchase_orders SET status = 'approved' WHERE id = ?", [poId]);

    try {
        await axios.post(`${API_URL}/inventory/in`, {
            material_id: matId,
            quantity: 10,
            reference_type: 'purchase_order',
            reference_id: poId,
            project_id: projId,
            notes: 'Approved Entry',
            usage_reason: 'Purchase'
        }, { headers });
        console.log('✅ SUCCESS: Approved PO IN accepted.');
    } catch (e) {
        console.log(`❌ FAILED: Approved PO IN rejected! ${e.message}`);
        if (e.response) console.log(e.response.data);
    }
}

runApiTest();
