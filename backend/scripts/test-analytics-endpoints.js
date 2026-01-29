const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/reports';

// Test credentials (adjust as needed)
const AUTH_TOKEN = process.env.TEST_TOKEN || '';

const client = axios.create({
    baseURL: BASE_URL,
    headers: AUTH_TOKEN ? { 'Authorization': `Bearer ${AUTH_TOKEN}` } : {}
});

console.log('🧪 Testing Analytics Endpoints...\n');

async function testEndpoint(name, url) {
    try {
        const response = await client.get(url);
        if (response.data.success) {
            console.log(`✅ ${name}: PASS`);
            console.log(`   Data points: ${Array.isArray(response.data.data) ? response.data.data.length : 'Single object'}`);
            return true;
        } else {
            console.log(`❌ ${name}: FAIL - ${response.data.message}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ${name}: ERROR - ${error.message}`);
        if (error.response?.data) {
            console.log(`   Details: ${JSON.stringify(error.response.data)}`);
        }
        return false;
    }
}

async function runTests() {
    const results = {
        passed: 0,
        failed: 0
    };

    console.log('=== EXISTING ENDPOINTS ===\n');

    if (await testEndpoint('Stock Summary', '/stock-summary')) results.passed++; else results.failed++;
    if (await testEndpoint('Material Consumption', '/material-consumption')) results.passed++; else results.failed++;
    if (await testEndpoint('Project Costs', '/project-costs')) results.passed++; else results.failed++;
    if (await testEndpoint('Income vs Expense', '/income-expense')) results.passed++; else results.failed++;
    if (await testEndpoint('Project Profit', '/project-profit')) results.passed++; else results.failed++;
    if (await testEndpoint('Dashboard Summary', '/dashboard-summary')) results.passed++; else results.failed++;

    console.log('\n=== FINANCIAL ANALYTICS ===\n');

    if (await testEndpoint('Income Breakdown', '/income-breakdown')) results.passed++; else results.failed++;
    if (await testEndpoint('Financial Timeline', '/financial-timeline')) results.passed++; else results.failed++;
    if (await testEndpoint('Profit Trend', '/profit-trend')) results.passed++; else results.failed++;

    console.log('\n=== PROJECT PROGRESS ANALYTICS ===\n');

    if (await testEndpoint('Project Progress', '/project-progress')) results.passed++; else results.failed++;
    if (await testEndpoint('Stage Bottlenecks', '/stage-bottlenecks')) results.passed++; else results.failed++;

    console.log('\n=== CUSTOMER & PAYMENT ANALYTICS ===\n');

    if (await testEndpoint('Payment Status Distribution', '/payment-status-distribution')) results.passed++; else results.failed++;
    if (await testEndpoint('Conversion Funnel', '/conversion-funnel')) results.passed++; else results.failed++;

    console.log('\n=== LABOUR & INVENTORY ANALYTICS ===\n');

    if (await testEndpoint('Labour Cost Trend', '/labour-cost-trend')) results.passed++; else results.failed++;
    if (await testEndpoint('Material Flow', '/material-flow')) results.passed++; else results.failed++;

    console.log('\n=== SUMMARY ===\n');
    console.log(`Total Tests: ${results.passed + results.failed}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

    if (results.failed === 0) {
        console.log('\n🎉 ALL ANALYTICS ENDPOINTS WORKING!\n');
    } else {
        console.log('\n⚠️  Some endpoints need attention.\n');
        process.exit(1);
    }
}

runTests().catch(console.error);
