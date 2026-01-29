const fetch = require('node-fetch');

async function testFinance() {
    console.log('💰 Testing Enhanced Payments (EMI/Loans)...\n');

    try {
        // 1. Login
        const login = await fetch('http://localhost:5001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        const { data: { token } } = await login.json();
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

        // 2. Get Metadata (Units/Customers) to create a booking
        const units = await fetch('http://localhost:5001/api/units', { headers }).then(r => r.json());
        const customers = await fetch('http://localhost:5001/api/customers', { headers }).then(r => r.json());

        // We need an available unit
        const availableUnit = units.data.find(u => u.status === 'available');
        if (!availableUnit) {
            console.log('⚠️ No available unit to test booking. Skipping Booking Creation.');
            // Try to fetch existing bookings
            const bookings = await fetch('http://localhost:5001/api/bookings', { headers }).then(r => r.json());
            if (bookings.data.length > 0) {
                const bookingId = bookings.data[0].id;
                console.log(`Using existing Booking #${bookingId} for Finance Test`);
                await testSchedule(bookingId, headers);
            } else {
                throw new Error('No units or bookings available to test');
            }
            return;
        }

        const customerId = customers.data[0]?.id || 1; // Assuming customer 1 exists if list empty for some reason, but previous tests created customers.

        // 3. Create Booking
        console.log(`1. Creating Booking for Unit ${availableUnit.unit_number}...`);
        const createBooking = await fetch('http://localhost:5001/api/bookings', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                customer_id: customerId,
                unit_id: availableUnit.id,
                booking_date: new Date().toISOString().split('T')[0],
                agreed_price: 5000000,
                notes: 'Finance Test'
            })
        });
        const bRes = await createBooking.json();
        if (!bRes.success) throw new Error('Booking failed: ' + bRes.message);
        const bookingId = bRes.data.id;
        console.log(`✅ Booking #${bookingId} Created`);

        await testSchedule(bookingId, headers);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function testSchedule(bookingId, headers) {
    // 4. Generate EMI Schedule
    console.log('\n2. Generating EMI Schedule (12 Months, 0% Interest)...');
    const gen = await fetch(`http://localhost:5001/api/finance/schedule/${bookingId}/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            totalAmount: 5000000,
            months: 12,
            startDate: new Date().toISOString().split('T')[0],
            interestRate: 0
        })
    });
    const genRes = await gen.json();
    console.log(genRes.success ? '✅ Schedule Generated' : '❌ Generation Failed: ' + genRes.message);

    // 5. Fetch Schedule
    console.log('\n3. Fetching Schedule...');
    const fetchSched = await fetch(`http://localhost:5001/api/finance/schedule/${bookingId}`, { headers });
    const schedData = await fetchSched.json();
    console.log('Schedule Response:', schedData);

    if (schedData.data && schedData.data.length === 12) {
        console.log(`✅ Verified 12 EMI Installments. First: ${schedData.data[0].amount}, Due: ${schedData.data[0].due_date}`);
    } else {
        console.log(`❌ Schedule Length Mismatch: Expected 12, Got ${schedData.data.length}`);
    }
}

testFinance();
