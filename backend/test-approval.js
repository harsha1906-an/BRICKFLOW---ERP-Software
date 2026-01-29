const axios = require('axios');

// UTILS
const API_URL = 'http://localhost:5001/api';
let adminToken = '';
let poId = '';

const login = async () => {
    console.log('1. Logging in as Admin...');
    const res = await axios.post(`${API_URL}/auth/login`, { username: 'admin', password: 'admin123' });
    adminToken = res.data.data.token;
    console.log('✅ Logged in.');
};

const createPO = async () => {
    console.log('2. Creating a fresh PO for approval...');
    const config = { headers: { Authorization: `Bearer ${adminToken}` } };

    // Get dependencies
    const [p, s, m] = await Promise.all([
        axios.get(`${API_URL}/projects`, config),
        axios.get(`${API_URL}/suppliers`, config),
        axios.get(`${API_URL}/materials`, config) // Updated to correct route
    ]);

    const poData = {
        project_id: p.data.data[0].id,
        supplier_id: s.data.data[0].id,
        items: [{ material_id: m.data.data[0].id, quantity: 50, unit_price: 10 }],
        order_date: '2025-02-01',
        expected_delivery_date: '2025-02-10',
        notes: 'Approval Test PO'
    };

    const res = await axios.post(`${API_URL}/purchase-orders`, poData, config);
    poId = res.data.data.id;
    console.log(`✅ PO Created. ID: ${poId}`);
};

const approvePO = async () => {
    console.log(`3. Approving PO ${poId}...`);
    const config = { headers: { Authorization: `Bearer ${adminToken}` } };

    // According to purchaseOrder.controller.js (inferred) or project structure, 
    // routes usually use /:id/status or PUT /:id with status field.
    // Checking route conventions: PO routes usually in purchaseOrder.routes.js.
    // Let's try the common patterns.

    try {
        const res = await axios.put(`${API_URL}/purchase-orders/${poId}/status`, { status: 'approved' }, config);
        console.log('✅ Approval request sent (PUT /status).');
    } catch (e) {
        // Fallback or retry logic if route differs
        console.log('⚠️ PATCH failed, trying different route...');
        throw e;
    }

    // Verify status
    const getRes = await axios.get(`${API_URL}/purchase-orders/${poId}`, config);
    const status = getRes.data.data.status;
    if (status === 'approved') {
        console.log('✅ VERIFIED: PO Status is "approved"');
    } else {
        console.error(`❌ FAILED: PO Status is "${status}"`);
        process.exit(1);
    }
};

const run = async () => {
    try {
        await login();
        await createPO();
        await approvePO();
        console.log('\n✨ APPROVAL FLOW CHECK PASSED');
    } catch (e) {
        console.error('❌ ERROR:', e.message, e.response?.data);
    }
};

run();
