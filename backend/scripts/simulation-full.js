const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5001/api';
const LOG_FILE = 'simulation-report.log';
const OUTPUT_DIR = path.join(__dirname, '../simulation_output');

// Ensure output dir exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

// Utility to log results
const log = (msg) => {
    const timestamp = new Date().toISOString();
    const logMsg = `[${timestamp}] ${msg}`;
    console.log(logMsg);
    fs.appendFileSync(LOG_FILE, logMsg + '\n');
};

const state = {}; // Store IDs for chaining

async function runSimulation() {
    log('🚀 STARTING FULL SYSTEM SIMULATION 🚀');
    log('-----------------------------------');

    // 1. Authentication
    try {
        log('\n🔐 STEP 1: Authentication');
        const res = await axios.post(`${BASE_URL}/auth/login`, {
            username: "admin",
            password: "admin123"
        });
        state.token = res.data.token;
        state.headers = { Authorization: `Bearer ${state.token}` };
        log('   ✅ Login Successful');
    } catch (e) {
        log(`   ❌ Login Failed: ${e.message}`);
        process.exit(1);
    }

    // 2. Project Management
    try {
        log('\nMf STEP 2: Project Management');
        const res = await axios.post(`${BASE_URL}/projects`, {
            name: `Simulated Tower ${Date.now()}`,
            location: "Simulation City",
            start_date: "2024-02-01",
            status: "planning"
        }, { headers: state.headers });
        state.projectId = res.data.data.id;
        log(`   ✅ Project Created (ID: ${state.projectId})`);

        // Add Units
        await axios.post(`${BASE_URL}/units`, {
            project_id: state.projectId,
            unit_number: "SIM-101",
            type: "3BHK",
            price: 7500000,
            status: "available"
        }, { headers: state.headers });
        const unitRes = await axios.post(`${BASE_URL}/units`, {
            project_id: state.projectId,
            unit_number: "SIM-102",
            type: "4BHK",
            price: 12500000,
            status: "available"
        }, { headers: state.headers });
        state.unitId = unitRes.data.data.id;
        log('   ✅ Units Added (SIM-101, SIM-102)');
    } catch (e) {
        log(`   ❌ Project/Unit Step Failed: ${e.message}`);
    }

    // 3. Procurement & Inventory
    try {
        log('\n🧱 STEP 3: Procurement & Inventory');
        // Add Supplier
        const supRes = await axios.post(`${BASE_URL}/suppliers`, {
            name: "Simulated Steel Co.",
            contact_person: "John Doe",
            phone: "9998887776",
            email: "supplier@sim.com"
        }, { headers: state.headers });
        state.supplierId = supRes.data.data.id;
        log(`   ✅ Supplier Added (ID: ${state.supplierId})`);

        // Create Purchase (Direct)
        const purRes = await axios.post(`${BASE_URL}/purchases`, {
            supplier_id: state.supplierId,
            purchase_date: "2024-02-01",
            status: "confirmed",
            materials: [
                { material_id: 1, quantity: 100, rate: 450 } // Assuming Cement (id:1) exists
            ],
            notes: "Simulation Purchase"
        }, { headers: state.headers });
        state.purchaseId = purRes.data.data.id;
        log(`   ✅ Purchase Recorded (ID: ${state.purchaseId})`);

        // Verify Inventory Effect
        const invRes = await axios.get(`${BASE_URL}/inventory/material/1`, { headers: state.headers });
        log(`   ✅ Inventory Verified. Current Stock: ${invRes.data.data.current_stock}`);
    } catch (e) {
        log(`   ❌ Procurement Step Failed: ${e.message}`);
        console.error(e.response ? e.response.data : e);
    }

    // 4. Sales & Booking
    try {
        log('\n💰 STEP 4: Sales & Booking');
        // Add Customer
        const custRes = await axios.post(`${BASE_URL}/customers`, {
            name: "Simulated Buyer",
            phone: "9876598765",
            email: "buyer@sim.com",
            address: "123 Sim St"
        }, { headers: state.headers });
        state.customerId = custRes.data.data.id;
        log(`   ✅ Customer Added (ID: ${state.customerId})`);

        // Create Booking
        const bookRes = await axios.post(`${BASE_URL}/bookings`, {
            customer_id: state.customerId,
            unit_id: state.unitId,
            booking_date: "2024-02-02",
            agreed_price: 12000000,
            status: "booked",
            notes: "Simulation Booking"
        }, { headers: state.headers });
        state.bookingId = bookRes.data.data.id;
        log(`   ✅ Unit Booked (ID: ${state.bookingId})`);
    } catch (e) {
        log(`   ❌ Sales Step Failed: ${e.message}`);
        console.error(e.response ? e.response.data : e);
    }

    // 5. Payments & Invoices
    try {
        log('\n💳 STEP 5: Payments & Invoices');
        // Record Payment
        const payRes = await axios.post(`${BASE_URL}/payments`, {
            booking_id: state.bookingId,
            payment_date: "2024-02-02",
            amount: 100000,
            payment_method: "online",
            reference_number: "SIM-TXN-001",
            notes: "Booking Advance",
            has_gst: true,
            gst_percentage: 18
        }, { headers: state.headers });
        state.paymentId = payRes.data.data.id;
        log(`   ✅ Payment Recorded (ID: ${state.paymentId})`);

        // Generate Invoice/Receipt
        // This endpoint usually streams a PDF. We'll save it.
        const receiptRes = await axios.get(`${BASE_URL}/payments/${state.paymentId}/receipt`, {
            headers: state.headers,
            responseType: 'arraybuffer'
        });
        const pdfPath = path.join(OUTPUT_DIR, `receipt_${state.paymentId}.pdf`);
        fs.writeFileSync(pdfPath, receiptRes.data);
        log(`   ✅ Receipt PDF Generated: ${pdfPath} (Size: ${receiptRes.data.length} bytes)`);

    } catch (e) {
        log(`   ❌ Payment Step Failed: ${e.message}`);
        console.error(e.response ? e.response.data : e);
    }

    // 6. Notifications
    try {
        log('\n🔔 STEP 6: Notifications');
        // Check notifications (Payment should have triggered one)
        const notifRes = await axios.get(`${BASE_URL}/notifications`, { headers: state.headers });
        const notifications = notifRes.data.data;
        if (notifications.length > 0) {
            log(`   ✅ Notifications Checked: Found ${notifications.length}`);
            log(`   📝 Latest: ${notifications[0].title} - ${notifications[0].message}`);
        } else {
            log('   ⚠️ No notifications found (Check Notification Service)');
        }
    } catch (e) {
        log(`   ❌ Notification Step Failed: ${e.message}`);
    }

    // 7. Expenses
    try {
        log('\n💸 STEP 7: Expenses');
        await axios.post(`${BASE_URL}/expenses`, {
            project_id: state.projectId,
            expense_date: "2024-02-02",
            category: "labour",
            amount: 5000,
            notes: "Simulation Labour Expense",
            is_accountable: 1
        }, { headers: state.headers });
        log('   ✅ Expense Recorded');
    } catch (e) {
        log(`   ❌ Expense Step Failed: ${e.message}`);
    }

    // 8. Labour Module
    try {
        log('\n👷 STEP 8: Labour Management');
        // Add Labour
        const labRes = await axios.post(`${BASE_URL}/labour`, {
            name: "Simulated Worker",
            type: "mason",
            gender: "male",
            phone: "8887776665",
            daily_wage: 800
        }, { headers: state.headers });
        state.labourId = labRes.data.data.id;
        log(`   ✅ Labour Added (ID: ${state.labourId})`);

        // Mark Attendance
        await axios.post(`${BASE_URL}/labour/attendance`, {
            labour_id: state.labourId,
            project_id: state.projectId,
            attendance_date: "2024-02-02",
            status: "present",
            time_in: "09:00",
            time_out: "18:00"
        }, { headers: state.headers });
        log('   ✅ Attendance Marked');
    } catch (e) {
        log(`   ❌ Labour Step Failed: ${e.message}`);
    }

    // 9. Dashboard/Monitoring
    try {
        log('\n📊 STEP 9: Final Dashboard Check');
        const dashRes = await axios.get(`${BASE_URL}/admin/dashboard`, { headers: state.headers });
        const stats = dashRes.data.data;
        log('   ✅ Dashboard Accessed');
        log('   -------------------------');
        log(`   📈 Projects: ${stats.business.projects}`);
        log(`   📈 Sold Units: ${stats.business.unitsSold}`);
        log('   -------------------------');
    } catch (e) {
        log(`   ❌ Dashboard Step Failed: ${e.message}`);
    }


    log('\n-----------------------------------');
    log('🎉 SIMULATION COMPLETED SUCCESSFULLY');
}

runSimulation();
