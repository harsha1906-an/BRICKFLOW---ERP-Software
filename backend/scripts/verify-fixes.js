const axios = require('axios');
const API_URL = 'http://localhost:5001/api';

// Simple check of the route again to be absolutely sure
async function verify() {
    try {
        const res = await axios.get(`${API_URL}/payment-methods`);
        if (res.status === 200 && Array.isArray(res.data.data)) {
            console.log('✅ BACKEND: GET /api/payment-methods is working. Frontend should receive data.');
            console.log('   Methods returned:', res.data.data.map(m => m.name).join(', '));
        } else {
            console.error('❌ BACKEND: API response format incorrect.');
        }
    } catch (e) {
        console.error('❌ BACKEND: API Route check failed:', e.message);
    }
}
verify();
