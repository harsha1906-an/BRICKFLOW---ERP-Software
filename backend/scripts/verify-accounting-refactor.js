const { create } = require('../src/models/payment.model');
const { runQuery } = require('../src/config/db');
const axios = require('axios');
const API_URL = 'http://localhost:5001/api';

async function verify() {
    console.log('🚀 Verifying Accounting Refactor...');

    // 1. Login
    let token;
    try {
        // Fallback to auto-create logic if needed, but assuming simple login first
        const loginRes = await axios.post(`${API_URL}/auth/login`, { username: 'admin', password: 'adminpassword' })
            .catch(async () => {
                // Try register temp admin
                await axios.post(`${API_URL}/auth/register`, { username: 'verifier_acc_' + Date.now(), password: 'Test@1234', role: 'admin', name: 'Verifier' });
                return await axios.post(`${API_URL}/auth/login`, { username: 'verifier_acc_' + Date.now(), password: 'Test@1234' });
            });
        token = loginRes.data.token;
    } catch (e) {
        console.error('❌ Login failed:', e.message);
        process.exit(1);
    }
    const headers = { Authorization: `Bearer ${token}` };

    // 2. Test Case 1: NON_ACCOUNTABLE with GST (Should trigger validation error or be forced to 0)
    // NOTE: After Phase 3 (Validation), this should fail if GST fields are present? 
    // Or if we allow them but ignore them, check DB result.
    // User Requirement: "Backend must override incorrect frontend input" -> So likely accept but force 0.
    // BUT Validation Phase says: "If NON_ACCOUNTABLE -> gst_amount MUST be 0" -> Implicitly validation could fail if consumer sends > 0?
    // Let's assume STRICT validation ideally rejects, but Model logic overwrites is fallback.
    // Let's test standard "Good" cases first.

    console.log('\n🧪 Test 1: Creating ACCOUNTABLE payment...');
    try {
        const res = await axios.post(`${API_URL}/payments`, {
            booking_id: 1,
            payment_date: '2023-11-20',
            amount: 100,
            payment_method: 'cash',
            accounting_type: 'ACCOUNTABLE',
            has_gst: true,
            gst_percentage: 18
        }, { headers });
        console.log('✅ Created ACCOUNTABLE payment:', res.data.data.id);
        if (res.data.data.gst_amount > 0) console.log('   GST Amount Verified:', res.data.data.gst_amount);
        else console.error('   ❌ Expected GST amount > 0');
    } catch (e) {
        console.error('❌ Test 1 Failed:', e.response?.data || e.message);
    }

    console.log('\n🧪 Test 2: Creating NON_ACCOUNTABLE payment (Should force GST 0)...');
    try {
        const res = await axios.post(`${API_URL}/payments`, {
            booking_id: 1,
            payment_date: '2023-11-20',
            amount: 100,
            payment_method: 'cash',
            accounting_type: 'NON_ACCOUNTABLE',
            has_gst: true, // Frontend sends "True" by mistake?
            gst_percentage: 18
        }, { headers });
        console.log('✅ Created NON_ACCOUNTABLE payment:', res.data.data.id);
        if (res.data.data.gst_amount === 0) console.log('   ✅ GST Amount is 0 (Correct)');
        else console.error('   ❌ BUG: GST Amount is', res.data.data.gst_amount);
    } catch (e) {
        console.error('❌ Test 2 Failed:', e.response?.data || e.message);
    }

    console.log('\n🏁 Verification Done');
}

verify();
