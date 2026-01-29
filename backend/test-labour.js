const fetch = require('node-fetch');

async function testLabour() {
    console.log('👷 Testing Labour Management Module...\n');

    try {
        // 1. Login
        const login = await fetch('http://localhost:5001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        const { data: { token } } = await login.json();
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

        // 2. Create Labour
        console.log('1. Creating Worker...');
        const create = await fetch('http://localhost:5001/api/labour', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: 'Test Mason',
                type: 'mason',
                gender: 'male',
                daily_wage: 850
            })
        });
        const worker = await create.json();
        console.log(worker.success ? '✅ Worker created' : '❌ Failed');

        // 3. Mark Attendance
        console.log('\n2. Marking Attendance...');
        const attendance = await fetch('http://localhost:5001/api/labour/attendance', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                labour_id: worker.data?.id,
                project_id: 1, // Assuming project 1 exists from previous tests
                attendance_date: new Date().toISOString().split('T')[0],
                status: 'present'
            })
        });
        const attResult = await attendance.json();
        console.log(attResult.success ? '✅ Attendance marked' : '❌ Failed');

        console.log('\n✨ Labour Module Test Complete');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testLabour();
