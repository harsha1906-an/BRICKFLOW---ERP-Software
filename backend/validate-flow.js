const axios = require('axios');

const API_URL = 'http://localhost:5001/api';
let token = '';

const run = async () => {
    try {
        console.log('🔄 Starting Flow Validation...');

        // 1. Login
        console.log('1. Logging in as Admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'admin',
            password: 'admin123'
        });
        token = loginRes.data.data.token; // Correct extraction: res.data (axios) -> .data (api) -> .token
        console.log(`✅ Login Successful. Token: ${token ? token.substring(0, 15) + '...' : 'UNDEFINED'}`);

        // 2. Get Prerequisites
        console.log('2. Fetching Prerequisite Data...');
        const headers = { 'Authorization': `Bearer ${token}` };
        console.log('   Headers:', headers);

        const projectsRes = await axios.get(`${API_URL}/projects`, { headers });
        const projectId = projectsRes.data.data[0].id; // Use first project
        console.log(`   - Project ID: ${projectId}`);

        const suppliersRes = await axios.get(`${API_URL}/suppliers`, { headers });
        const supplierId = suppliersRes.data.data[0].id; // Use first supplier
        console.log(`   - Supplier ID: ${supplierId}`);

        const materialsRes = await axios.get(`${API_URL}/inventory/materials`, { headers });
        const materialId = materialsRes.data.data[0].id; // Use first material
        console.log(`   - Material ID: ${materialId}`);

        // 3. Create Purchase Order
        console.log('3. Creating Purchase Order...');
        const poData = {
            project_id: projectId,
            supplier_id: supplierId,
            items: [
                {
                    material_id: materialId,
                    quantity: 100,
                    unit_price: 350
                }
            ],
            expected_date: '2024-02-15',
            notes: 'Test PO from Validation Script'
        };

        const createRes = await axios.post(`${API_URL}/purchase-orders`, poData, { headers });
        console.log('✅ Purchase Order Created Successfully!');
        console.log('   - PO ID:', createRes.data.data.id);
        console.log('   - Status:', createRes.data.data.status);

        console.log('\n✨ FLOW VALIDATION COMPLETE: SYSTEM IS STABLE');

    } catch (error) {
        console.error('❌ VALIDATION FAILED:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
};

run();
