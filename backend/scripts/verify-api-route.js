const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

async function verify() {
    console.log('🚀 Verifying /api/payment-methods...');
    try {
        const res = await axios.get(`${API_URL}/payment-methods`);
        const methods = res.data.data;

        if (!Array.isArray(methods)) {
            console.error('❌ Response is not an array:', res.data);
            return;
        }

        console.log(`✅ Found ${methods.length} methods.`);
        console.log('Sample:', methods.slice(0, 3).map(m => `${m.code} (${m.id})`).join(', '));

        // Validation
        const required = ['loan', 'emi', 'cash'];
        const missing = required.filter(r => !methods.find(m => m.code === r));

        if (missing.length === 0) {
            console.log('✅ All critical methods present.');
        } else {
            console.error('❌ Missing methods:', missing);
        }

    } catch (e) {
        console.error('❌ Endpoint Failed:', e.message);
    }
}

verify();
