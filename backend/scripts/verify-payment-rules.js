const { create, getTotalPaid } = require('../src/models/payment.model');
const Booking = require('../src/models/booking.model');
const { runQuery } = require('../src/config/db');
const Joi = require('joi');

// Mock req logic
const mockUser = { id: 1 };

async function runTest() {
    console.log('🧪 Starting Payment Logic Verification...');

    // 0. Setup: Create Parents (Project, Customer) first
    const Unit = require('../src/models/unit.model');
    const { runQuery } = require('../src/config/db');

    // Create random project
    const projNum = 'PROJ-' + Math.floor(Math.random() * 1000);
    const projRes = await runQuery(
        `INSERT INTO projects (name, location, status, created_by) VALUES (?, 'Test Loc', 'ongoing', 1)`,
        [projNum]
    );
    const projectId = projRes.id;
    console.log(`✅ Setup: Test Project ${projectId} created.`);

    // Create random customer
    const custName = 'Tester ' + Math.floor(Math.random() * 1000);
    const custRes = await runQuery(
        `INSERT INTO customers (name, phone, email) VALUES (?, '1112223333', 'test@example.com')`,
        [custName]
    );
    const customerId = custRes.id;
    console.log(`✅ Setup: Test Customer ${customerId} created.`);

    // Create random unit number
    const unitNum = 'TEST-' + Math.floor(Math.random() * 10000);
    const unitIdRes = await runQuery(
        `INSERT INTO units (project_id, unit_number, type, size, price, status, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [projectId, unitNum, '2BHK', 1000, 10000, 'available', 1]
    );
    const unitId = unitIdRes.id;
    console.log(`✅ Setup: Test Unit ${unitId} (${unitNum}) created.`);

    // 1. Setup: Create a fresh booking
    const bookingId = await Booking.create({
        customer_id: customerId,
        unit_id: unitId,
        booking_date: '2023-01-01',
        agreed_price: 1000,
        notes: 'Logic Test'
    });
    console.log(`✅ Setup: Booking ${bookingId} created. Price: 1000`);

    try {
        // 2. Pay 500 Cash
        console.log('\n--- Test: Partial Payment (Cash) ---');
        await create({
            booking_id: bookingId,
            payment_date: '2023-01-02',
            amount: 500,
            payment_method: 'cash',
            notes: 'Part 1',
            accounting_type: 'ACCOUNTABLE',
            created_by: 1
        });
        const bal1 = await Booking.getBalance(bookingId);
        console.log(`Paid 500. Balance: ${bal1.balance} (Expected: 500). Status: ${bal1.balance === 500 ? '✅' : '❌'}`);

        // 3. Pay 200 Bank
        console.log('\n--- Test: Partial Payment (Bank) ---');
        await create({
            booking_id: bookingId,
            payment_date: '2023-01-03',
            amount: 200,
            payment_method: 'bank',
            notes: 'Part 2',
            accounting_type: 'ACCOUNTABLE',
            created_by: 1
        });
        const bal2 = await Booking.getBalance(bookingId);
        console.log(`Paid 200. Balance: ${bal2.balance} (Expected: 300). Status: ${bal2.balance === 300 ? '✅' : '❌'}`);

        // 4. Attempt Overpayment (Default Blocked)
        console.log('\n--- Test: Overpayment (Blocked) ---');
        try {
            await create({
                booking_id: bookingId,
                payment_date: '2023-01-04',
                amount: 400,
                payment_method: 'loan',
                notes: 'Should Fail',
                accounting_type: 'ACCOUNTABLE',
                created_by: 1
            });
            console.log('❌ Failed: Overpayment was allowed!');
        } catch (e) {
            console.log(`✅ Success: Overpayment blocked. Error: ${e.message.split('.')[0]}`);
        }

        // 5. Allowed Overpayment
        console.log('\n--- Test: Overpayment (Allowed) ---');
        await create({
            booking_id: bookingId,
            payment_date: '2023-01-04',
            amount: 400,
            payment_method: 'loan',
            notes: 'Overpay Force',
            allow_overpayment: true,
            accounting_type: 'ACCOUNTABLE',
            created_by: 1
        });
        const bal3 = await Booking.getBalance(bookingId);
        console.log(`Paid 400 (Force). Balance: ${bal3.balance} (Expected: -100). Status: ${bal3.balance === -100 ? '✅' : '❌'}`);

        // 6. Refund (Negative Entry)
        console.log('\n--- Test: Refund (-100) ---');
        try {
            await create({
                booking_id: bookingId,
                payment_date: '2023-01-05',
                amount: -100,
                payment_method: 'cash',
                notes: 'Refund',
                allow_overpayment: true, // Need this? Maybe not for refund but safety 
                accounting_type: 'ACCOUNTABLE',
                created_by: 1
            });
            const bal4 = await Booking.getBalance(bookingId);
            console.log(`Refunded 100. Balance: ${bal4.balance} (Expected: 0). Status: ${bal4.balance === 0 ? '✅' : '❌'}`);
        } catch (e) {
            console.log(`❌ Refund Failed: ${e.message}`);
        }

        // 7. Verify Append Only (Count records)
        const totalPaid = await getTotalPaid(bookingId);
        console.log(`\nFinal Total Paid Calc: ${totalPaid} (Expected: 1000)`);

    } catch (e) {
        console.error('❌ Test Suite Failed:', e);
    } finally {
        // Cleanup if needed, but sqlite file persists.
        // process.exit();
    }
}

runTest();
