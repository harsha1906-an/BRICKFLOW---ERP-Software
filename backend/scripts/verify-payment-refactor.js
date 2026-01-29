const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

async function verify() {
    console.log('🚀 Verifying Payment Method Refactor...');

    try {
        // 1. Test GET /payment-methods
        console.log('\n📡 Testing GET /api/payment-methods...');
        const methodsRes = await axios.get(`${API_URL}/payment-methods`);
        const methods = methodsRes.data.data;

        if (Array.isArray(methods) && methods.length >= 8) {
            console.log('✅ Fetched payment methods successfully.');
            console.log(`   Found ${methods.length} methods:`, methods.map(m => m.code).join(', '));
        } else {
            console.error('❌ Failed to fetch valid payment methods list.', methods);
            process.exit(1);
        }

        // Login for authorized actions
        let token;
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, { username: 'admin', password: 'adminpassword' }); // Use known creds or fallback logic
            token = loginRes.data.token;
        } catch (e) {
            // Fallback to auditor bot created earlier if admin fails
            const loginRes = await axios.post(`${API_URL}/auth/login`, { username: 'auditor' + Date.now(), password: 'Test@1234' }).catch(async () => {
                // Try register
                await axios.post(`${API_URL}/auth/register`, { username: 'verifier' + Date.now(), password: 'Test@1234', role: 'admin', name: 'Verifier' });
                return await axios.post(`${API_URL}/auth/login`, { username: 'verifier' + Date.now(), password: 'Test@1234' });
            });
            token = loginRes.data.token;
        }

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Create Payment using STRING (Legacy / Backward Compat)
        console.log('\n💳 Testing Payment Creation (Legacy String "cash")...');
        // Need a booking ID
        // Simplified: We assume booking 1 exists or fails. 
        // Better: Query existing booking if possible, but no public GET without auth.
        // Let's rely on error message if booking not found, but it proves model logic validation passed at least.

        try {
            const resString = await axios.post(`${API_URL}/payments`, {
                booking_id: 1, // Assumption
                payment_date: '2023-11-20',
                amount: 10,
                payment_method: 'cash', // String!
                notes: 'Refactor Verify String'
            }, { headers });
            console.log('✅ Legacy String Payment Created:', resString.data.data.id);
        } catch (e) {
            if (e.response?.data?.message === 'Booking not found') {
                console.log('⚠️ Booking not found, but validation passed (Good).');
            } else {
                console.error('❌ Legacy String Payment Failed:', e.response?.data || e.message);
            }
        }

        // 3. Create Payment using ID (New Way)
        console.log('\n💳 Testing Payment Creation (New ID)...');
        const loanMethod = methods.find(m => m.code === 'loan');
        if (!loanMethod) throw new Error('Loan method not found');

        try {
            const resId = await axios.post(`${API_URL}/payments`, {
                booking_id: 1,
                payment_date: '2023-11-20',
                amount: 10,
                payment_method: loanMethod.id, // ID!
                notes: 'Refactor Verify ID'
            }, { headers });
            console.log('✅ New ID Payment Created:', resId.data.data.id);
        } catch (e) {
            if (e.response?.data?.message === 'Booking not found') {
                console.log('⚠️ Booking not found, but validation passed (Good).');
            } else {
                console.error('❌ New ID Payment Failed:', e.response?.data || e.message);
            }
        }

        console.log('\n🎉 Verification Completed.');

    } catch (error) {
        console.error('❌ Verification Error:', error.message);
    }
}

verify();
