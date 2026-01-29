const fetch = require('node-fetch');

async function testAnalytics() {
    console.log('👥 Testing Customer Analytics Module...\n');

    try {
        // 1. Login
        const login = await fetch('http://localhost:5001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        const { data: { token } } = await login.json();
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

        // 2. Create Lead
        console.log('1. Creating New Lead...');
        const create = await fetch('http://localhost:5001/api/customers', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: 'Analytics Test User',
                phone: '9876543210',
                email: 'test@analytics.com',
                source: 'Website',
                current_status: 'New'
            })
        });
        const lead = await create.json();
        console.log(lead.success ? '✅ Lead created' : '❌ Failed: ' + lead.message);

        if (lead.success && lead.data?.id) {
            const customerId = lead.data.id;

            // 3. Add Visit
            console.log('\n2. Logging Visit...');
            const visit = await fetch('http://localhost:5001/api/customers/visits', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    customer_id: customerId,
                    visit_date: new Date().toISOString().split('T')[0],
                    visit_type: 'Scheduled',
                    notes: 'Interested in 3BHK'
                })
            });
            const visitResult = await visit.json();
            console.log(visitResult.success ? '✅ Visit logged' : '❌ Failed: ' + visitResult.message);

            // 4. Update Status
            console.log('\n3. Updating Status Pipeline...');
            const status = await fetch(`http://localhost:5001/api/customers/status/${customerId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    status: 'Interested',
                    priority: 'High',
                    follow_up_date: new Date().toISOString().split('T')[0]
                })
            });
            const statusResult = await status.json();
            console.log(statusResult.success ? '✅ Pipeline updated' : '❌ Failed: ' + statusResult.message);
        }

        // 5. Get Analytics
        console.log('\n4. Fetching Dashboard Analytics...');
        const analytics = await fetch('http://localhost:5001/api/customers/analytics/dashboard', {
            headers
        });
        const data = await analytics.json();
        if (data.success) {
            console.log('✅ Analytics fetched');
            console.log('   - Total Leads:', data.data.totalByStatus.reduce((a, b) => a + b.count, 0));
            console.log('   - Conversion Rate:', data.data.conversionRate + '%');
        } else {
            console.log('❌ Failed: ' + data.message);
        }

        console.log('\n✨ Customer Analytics Test Complete');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testAnalytics();
