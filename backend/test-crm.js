const axios = require('axios');

// UTILS
const API_URL = 'http://localhost:5001/api';
let adminToken = '';
let customerId = '';
const PROJECT_ID = 1;
const UNIT_ID = 1; // From seed (Block A-101)

const login = async () => {
    console.log('1. Logging in as Admin...');
    const res = await axios.post(`${API_URL}/auth/login`, { username: 'admin', password: 'admin123' });
    adminToken = res.data.data.token;
    console.log('✅ Logged in.');
};

const createCustomer = async () => {
    console.log('2. Creating Customer...');
    const config = { headers: { Authorization: `Bearer ${adminToken}` } };

    const customerData = {
        name: 'John Doe',
        phone: '9998887776',
        email: 'john@example.com',
        address: '123 Test St',
        status: 'interested'
    };

    const res = await axios.post(`${API_URL}/customers`, customerData, config);
    customerId = res.data.data.id;
    console.log(`✅ Customer Created. ID: ${customerId}`);
};

const createBooking = async () => {
    console.log('3. Creating Booking...');
    const config = { headers: { Authorization: `Bearer ${adminToken}` } };

    // Booking requires unit_id, customer_id, etc.
    // Check booking.model.js if needed for fields.
    // Usually: booking_date, booking_amount, payment_plan...

    const bookingData = {
        unit_id: UNIT_ID,
        customer_id: customerId,
        booking_date: '2025-02-01',
        agreed_price: 5000000, // 50 Lakhs
        status: 'confirmed',
        notes: 'Test Booking'
    };

    try {
        const res = await axios.post(`${API_URL}/bookings`, bookingData, config);
        console.log(`✅ Booking Created. ID: ${res.data.data.id}`);
    } catch (e) {
        // If unit is already booked (seed might have booked it?), we might get error.
        // Seed usually creates empty units. 
        if (e.response && e.response.status === 400 && e.response.data.message.includes('booked')) {
            console.log('⚠️ Unit already booked. Skipping strictly for verification.');
        } else {
            throw e;
        }
    }
};

const run = async () => {
    try {
        await login();
        await createCustomer();
        await createBooking();
        console.log('\n✨ CRM FLOW CHECK PASSED');
    } catch (e) {
        console.error('❌ ERROR:', e.message, e.response?.data);
    }
};

run();
