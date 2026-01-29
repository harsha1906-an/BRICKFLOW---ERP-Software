const axios = require('axios');

// UTILS
const API_URL = 'http://localhost:5001/api';
let adminToken = '';
const UNIT_ID = 1;
const STAGE_ID = 1; // Foundation
let bookingId = ''; // We need to fetch this or assume from previous run.
// Since previous run created a booking on Unit 1, we can fetch bookings for Unit 1.

const login = async () => {
    console.log('1. Logging in as Admin...');
    const res = await axios.post(`${API_URL}/auth/login`, { username: 'admin', password: 'admin123' });
    adminToken = res.data.data.token;
    console.log('✅ Logged in.');
};

const getBooking = async () => {
    console.log('2. Fetching Booking for Unit 1...');
    const config = { headers: { Authorization: `Bearer ${adminToken}` } };
    const res = await axios.get(`${API_URL}/bookings`, config);
    const booking = res.data.data.find(b => b.unit_id === UNIT_ID);
    if (!booking) {
        throw new Error('No booking found for Unit 1. Run test-crm.js first.');
    }
    bookingId = booking.id;
    customerId = booking.customer_id; // Capture customer_id
    console.log(`✅ Found Booking ID: ${bookingId}, Customer ID: ${customerId}`);
};

const initializeProgress = async () => {
    console.log('2.5. Initializing Unit Progress...');
    const config = { headers: { Authorization: `Bearer ${adminToken}` } };
    try {
        await axios.post(`${API_URL}/progress/unit/${UNIT_ID}/initialize`, {}, config);
        console.log('✅ Unit Progress Initialized');
    } catch (e) {
        console.log('⚠️ Initialization FAILED. Response:', e.response?.data);
    }
};

const markProgress = async () => {
    console.log('3. Marking Stage 1 (Foundation) as COMPLETED...');
    const config = { headers: { Authorization: `Bearer ${adminToken}` } };

    // Correct route: PUT /unit/:unitId/stage/:stageId
    const progressData = {
        status: 'COMPLETED',
        notes: 'Verified via API'
    };

    const res = await axios.put(`${API_URL}/progress/unit/${UNIT_ID}/stage/${STAGE_ID}`, progressData, config);
    console.log('✅ Progress Updated. ID:', res.data.data.id);
};

const verifyAutoPaymentRequest = async () => {
    console.log('4. Verifying Auto-Created Payment Request...');
    const config = { headers: { Authorization: `Bearer ${adminToken}` } };

    // Fetch all requests
    const res = await axios.get(`${API_URL}/payment-requests`, config);

    // Find request for this booking
    const request = res.data.data.find(r => r.booking_id === bookingId);

    if (request) {
        console.log('✅ Auto-Created Payment Request Found!');
        console.log(`   ID: ${request.id}, Amount: ${request.amount_requested}, Due: ${request.due_date}`);
        console.log(`   Notes: ${request.notes}`);
    } else {
        console.error('❌ FAILED: No auto-created payment request found.');
        process.exit(1);
    }
};

const run = async () => {
    try {
        await login();
        await getBooking();
        await initializeProgress();
        await markProgress();
        await verifyAutoPaymentRequest();
        console.log('\n✨ PROGRESS & BILLING FLOW CHECK PASSED');
    } catch (e) {
        console.error('❌ ERROR:', e.message, e.response?.data);
    }
};

run();
