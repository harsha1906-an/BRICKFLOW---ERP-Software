const axios = require('axios');

// UTILS
const API_URL = 'http://localhost:5001/api';
let adminToken = '';
let poId = '';
const PROJECT_ID = 1;
const MATERIAL_ID = 1;
const QTY = 10;

const login = async () => {
    console.log('1. Logging in as Admin...');
    const res = await axios.post(`${API_URL}/auth/login`, { username: 'admin', password: 'admin123' });
    adminToken = res.data.data.token;
    console.log('✅ Logged in.');
};

const createAndApprovePO = async () => {
    console.log('2. Creating and Approving PO...');
    const config = { headers: { Authorization: `Bearer ${adminToken}` } };

    // Create
    const poData = {
        project_id: PROJECT_ID,
        supplier_id: 1, // Assuming ID 1 exists
        items: [{ material_id: MATERIAL_ID, quantity: QTY, unit_price: 100 }],
        order_date: '2025-02-01',
        expected_delivery_date: '2025-02-10',
        notes: 'Stock IN Test PO'
    };
    const createRes = await axios.post(`${API_URL}/purchase-orders`, poData, config);
    poId = createRes.data.data.id;
    console.log(`   - PO Created: ${poId}`);

    // Approve
    await axios.put(`${API_URL}/purchase-orders/${poId}/status`, { status: 'approved' }, config);
    console.log('   - PO Approved');
};

const getInitialStock = async () => {
    const config = { headers: { Authorization: `Bearer ${adminToken}` } };
    const res = await axios.get(`${API_URL}/inventory/stock/${MATERIAL_ID}?projectId=${PROJECT_ID}`, config);
    const stock = res.data.data ? (res.data.data.current_stock || 0) : 0;
    console.log(`3. Initial Stock: ${stock}`);
    return stock;
};

const recordStockIn = async () => {
    console.log('4. Recording Stock IN linked to PO...');
    const config = { headers: { Authorization: `Bearer ${adminToken}` } };

    const stockData = {
        project_id: PROJECT_ID,
        material_id: MATERIAL_ID,
        quantity: QTY,
        type: 'IN',
        reference_type: 'purchase_order', // Correct type
        reference_id: poId, // Linked to real approved PO
        notes: 'API Verification Stock IN (Linked)'
    };

    const res = await axios.post(`${API_URL}/inventory/in`, stockData, config);
    console.log('✅ Stock IN Recorded. Transaction ID:', res.data.data.id);
};

const verifyStockIncrease = async (startStock) => {
    console.log('5. Verifying Stock Increase...');
    const config = { headers: { Authorization: `Bearer ${adminToken}` } };
    const res = await axios.get(`${API_URL}/inventory/stock/${MATERIAL_ID}?projectId=${PROJECT_ID}`, config);

    const newStock = res.data.data ? (res.data.data.current_stock || 0) : 0;
    console.log(`   - Stock: ${startStock} -> ${newStock}`);

    if (newStock === startStock + QTY) {
        console.log('✅ VERIFIED: Stock increased correctly');
    } else {
        console.error(`❌ FAILED: Expected ${startStock + QTY}, got ${newStock}`);
        process.exit(1);
    }
};

const run = async () => {
    try {
        await login();
        await createAndApprovePO();
        const start = await getInitialStock();
        await recordStockIn();
        await verifyStockIncrease(start);
        console.log('\n✨ SUPPLY CHAIN FLOW CHECK PASSED');
    } catch (e) {
        console.error('❌ ERROR:', e.message, e.response?.data);
    }
};

run();
