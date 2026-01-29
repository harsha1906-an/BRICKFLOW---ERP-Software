const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

async function verifySystem() {
    try {
        console.log('🔍 Starting System Verification...');

        // 1. Login
        console.log('1️⃣  Testing Login...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'admin',
            password: 'admin123'
        });

        if (loginRes.status === 200) {
            console.log('DEBUG: Login Response:', JSON.stringify(loginRes.data, null, 2));
            const token = loginRes.data.data.token || loginRes.data.token;
            const headers = { Authorization: `Bearer ${token}` };

            // 2. Test Payments (Was 500)
            console.log('2️⃣  Testing Payments Endpoint...');
            try {
                const paymentsRes = await axios.get(`${API_URL}/payments`, { headers });
                console.log(`✅ Payments API Status: ${paymentsRes.status} OK`);
                console.log(`   Data Count: ${paymentsRes.data.length}`);
            } catch (err) {
                console.error('❌ Payments API FAILED:', err.response?.data || err.message);
                process.exit(1);
            }

            // 3. Test Payment Methods (Was failing due to missing table)
            console.log('3️⃣  Testing Payment Methods Endpoint...');
            try {
                const pmRes = await axios.get(`${API_URL}/payment-methods`, { headers });
                console.log(`✅ Payment Methods API Status: ${pmRes.status} OK`);
                console.log(`   Data Count: ${pmRes.data.length}`);
            } catch (err) {
                console.error('❌ Payment Methods API FAILED:', err.response?.data || err.message);
                process.exit(1);
            }

            // 4. Test Reports (Was 500 due to m.price)
            console.log('4️⃣  Testing Reports (Project Costs)...');
            try {
                const reportRes = await axios.get(`${API_URL}/reports/project-costs`, { headers });
                console.log(`✅ Reports API Status: ${reportRes.status} OK`);
                if (Array.isArray(reportRes.data)) {
                    console.log(`   Report Rows: ${reportRes.data.length}`);
                }
            } catch (err) {
                console.error('❌ Reports API FAILED:', err.response?.data || err.message);
                process.exit(1);
            }

            console.log('\n✨ SYSTEM VERIFICATION COMPLETED SUCCESSFULLY ✨');

        } else {
            console.error('❌ Login Failed');
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Verification Script Failed:', error.message);
        if (error.response) {
            console.error('   Response:', error.response.data);
        }
        process.exit(1);
    }
}

verifySystem();
