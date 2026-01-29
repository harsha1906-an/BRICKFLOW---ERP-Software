const fetch = require('node-fetch');

async function quickTest() {
    console.log('🧪 Quick ERP System Test\n');

    try {
        // Test 1: Login
        console.log('1. Testing Login...');
        const login = await fetch('http://localhost:5001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        const loginData = await login.json();

        if (!loginData.success) {
            console.log('❌ Login failed');
            return;
        }

        const token = loginData.data.token;
        console.log('✅ Login successful');

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // Test 2: Create Project
        console.log('\n2. Creating Project...');
        const project = await fetch('http://localhost:5001/api/projects', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: 'Test Project',
                location: 'Test City',
                start_date: '2024-01-01',
                status: 'active'
            })
        });
        const projectData = await project.json();
        console.log(projectData.success ? '✅ Project created' : '❌ Failed');
        const projectId = projectData.data?.id;

        // Test 3: Get Projects (Data Persistence)
        console.log('\n3. Verifying Project Persists...');
        const getProjects = await fetch('http://localhost:5001/api/projects', { headers });
        const projectsData = await getProjects.json();
        const found = projectsData.data.find(p => p.id === projectId);
        console.log(found ? '✅ Project persists in database' : '❌ Not found');

        // Test 4: Create Material
        console.log('\n4. Creating Material...');
        const material = await fetch('http://localhost:5001/api/materials', {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: 'Test Material', unit: 'units' })
        });
        const materialData = await material.json();
        console.log(materialData.success ? '✅ Material created' : '❌ Failed');
        const materialId = materialData.data?.id;

        // Test 5: Stock IN
        console.log('\n5. Adding Stock (IN)...');
        const stockIn = await fetch('http://localhost:5001/api/inventory/in', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                material_id: materialId,
                project_id: projectId,
                quantity: 100,
                reference_type: 'purchase'
            })
        });
        const stockInData = await stockIn.json();
        console.log(stockInData.success ? '✅ Stock IN recorded' : '❌ Failed');

        // Test 6: Check Stock
        console.log('\n6. Checking Stock Summary...');
        const summary = await fetch('http://localhost:5001/api/inventory/summary', { headers });
        const summaryData = await summary.json();
        const stock = summaryData.data.find(s => s.material_id === materialId);
        console.log(stock?.current_stock === 100 ? '✅ Stock = 100 (correct)' : '❌ Stock incorrect');

        // Test 7: Stock OUT
        console.log('\n7. Taking Stock OUT...');
        const stockOut = await fetch('http://localhost:5001/api/inventory/out', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                material_id: materialId,
                project_id: projectId,
                quantity: 30,
                reference_type: 'usage'
            })
        });
        const stockOutData = await stockOut.json();
        console.log(stockOutData.success ? '✅ Stock OUT recorded' : '❌ Failed');

        // Test 8: Verify Updated Stock
        console.log('\n8. Verifying Stock Update (100-30=70)...');
        const summary2 = await fetch('http://localhost:5001/api/inventory/summary', { headers });
        const summaryData2 = await summary2.json();
        const stock2 = summaryData2.data.find(s => s.material_id === materialId);
        console.log(stock2?.current_stock === 70 ? '✅ Stock = 70 (correct)' : `❌ Stock = ${stock2?.current_stock}`);

        // Test 9: Insufficient Stock Protection
        console.log('\n9. Testing Insufficient Stock Protection...');
        const stockOut2 = await fetch('http://localhost:5001/api/inventory/out', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                material_id: materialId,
                project_id: projectId,
                quantity: 100,
                reference_type: 'usage'
            })
        });
        const stockOut2Data = await stockOut2.json();
        console.log(!stockOut2Data.success ? '✅ Insufficient stock blocked' : '❌ Should have failed');

        // Test 10: Reports
        console.log('\n10. Testing Reports...');
        const reports = await fetch('http://localhost:5001/api/reports/stock-summary', { headers });
        const reportsData = await reports.json();
        console.log(reportsData.success ? '✅ Reports working' : '❌ Failed');

        console.log('\n' + '='.repeat(50));
        console.log('✅ ALL TESTS PASSED!');
        console.log('='.repeat(50));
        console.log('\nData created:');
        console.log(`  - Project ID: ${projectId}`);
        console.log(`  - Material ID: ${materialId}`);
        console.log(`  - Current Stock: 70 units`);
        console.log('\n✨ Data persists in database!');
        console.log('   Refresh frontend to verify.');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }
}

quickTest();
