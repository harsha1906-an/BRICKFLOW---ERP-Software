const { create } = require('../src/models/payment.model');
const { initDatabase } = require('../src/config/db');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Mock helpers
const dbPath = path.resolve(__dirname, '../database/erp.db');
const db = new sqlite3.Database(dbPath);

// Manual insertion for test
async function run() {
    console.log('🧪 Testing Accounting Logic...');

    // We need a booking first. Let's pick one.
    // Hack: We'll just define the booking_id = 1 (assuming it exists from previous tests)

    const payload = {
        booking_id: 1,
        payment_date: '2023-10-27',
        amount: 100,
        payment_method: 'cash',
        // The Bug Trigger: Non-accountable BUT has GST
        is_accountable: false, // Should allow NO GST
        has_gst: true,
        gst_percentage: 18,
        created_by: 1
    };

    try {
        // We initialize DB config first? 
        // effectively assume DB is set up (model uses require('../config/db'))
        // We assume create() allows us to run.

        console.log('Attempting to create NON-ACCOUNTABLE payment with GST...');
        const result = await create(payload);

        console.log('Payment Created:', result);

        if (result.gst_amount > 0) {
            console.error('❌ BUG CONFIRMED: GST amount recorded (' + result.gst_amount + ') for non-accountable payment!');
        } else {
            console.log('✅ CORRECT: GST amount is 0.');
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();
