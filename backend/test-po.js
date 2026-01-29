const axios = require('axios');

async function test() {
    try {
        console.log('1. Logging in...');
        const auth = await axios.post('http://localhost:5001/api/auth/login', {
            username: 'admin', password: 'admin123'
        });
        const token = auth.data.data.token;
        console.log('Logged in. Token len:', token.length);

        const config = { headers: { Authorization: `Bearer ${token}` } };

        console.log('2. Getting Project...');
        const proj = await axios.get('http://localhost:5001/api/projects', config);
        const projectId = proj.data.data[0].id;
        console.log('Project ID:', projectId);

        console.log('3. Getting Supplier...');
        const supp = await axios.get('http://localhost:5001/api/suppliers', config);
        const supplierId = supp.data.data[0].id;
        console.log('Supplier ID:', supplierId);

        console.log('4. Getting Material...');
        const mat = await axios.get('http://localhost:5001/api/inventory/materials', config);
        const materialId = mat.data.data[0].id;
        console.log('Material ID:', materialId);

        console.log('5. Creating PO...');
        const poData = {
            project_id: projectId,
            supplier_id: supplierId,
            items: [{ material_id: materialId, quantity: 10, unit_price: 100 }],
            expected_date: '2025-12-31',
            notes: 'Automated Test PO'
        };
        const po = await axios.post('http://localhost:5001/api/purchase-orders', poData, config);
        console.log('✅ PO Created! ID:', po.data.data.id);

    } catch (e) {
        console.error('❌ Failed:', e.message);
        if (e.response) console.error('Data:', e.response.data);
    }
}
test();
