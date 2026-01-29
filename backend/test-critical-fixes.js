// Hard Testing Script for Critical Fixes
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';

// Test Results Storage
const testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

function logTest(name, passed, details) {
    testResults.tests.push({ name, passed, details });
    if (passed) {
        testResults.passed++;
        console.log(`✅ PASS: ${name}`);
    } else {
        testResults.failed++;
        console.log(`❌ FAIL: ${name}`);
        console.log(`   Details: ${details}`);
    }
}

// Login first
async function login() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'admin',
            password: 'admin123'
        });
        authToken = response.data.token;
        console.log('🔐 Logged in successfully\n');
        return true;
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
        return false;
    }
}

const headers = () => ({ headers: { Authorization: `Bearer ${authToken}` } });

// ============================================================================
// TEST 1: Labour Advance Auto-Deduction
// ============================================================================
async function testAdvanceDeduction() {
    console.log('\n📝 TEST 1: Labour Advance Auto-Deduction\n');

    try {
        // Step 1: Record advance payment
        console.log('Step 1: Recording advance of ₹2000...');
        const advanceResponse = await axios.post(`${BASE_URL}/labour/payments`, {
            labour_id: 1,
            project_id: 1,
            payment_date: '2024-01-25',
            payment_type: 'advance',
            base_amount: 2000,
            overtime_amount: 0,
            bonus_amount: 0,
            payment_method: 'cash',
            notes: 'Test advance'
        }, headers());

        console.log(`   Advance recorded: ID ${advanceResponse.data.data.id}`);

        // Step 2: Record regular payment (should auto-deduct)
        console.log('Step 2: Recording payment of ₹2500 (should deduct ₹2000 advance)...');
        const paymentResponse = await axios.post(`${BASE_URL}/labour/payments`, {
            labour_id: 1,
            project_id: 1,
            payment_date: '2024-01-26',
            payment_type: 'daily',
            base_amount: 2500,
            overtime_amount: 0,
            bonus_amount: 0,
            payment_method: 'cash',
            notes: 'Test payment with advance deduction'
        }, headers());

        const result = paymentResponse.data.data;
        console.log(`   Payment recorded: ID ${result.id}`);
        console.log(`   Gross: ₹${result.gross_amount}`);
        console.log(`   Advances Deducted: ₹${result.advances_deducted}`);
        console.log(`   Net Payment: ₹${result.net_amount}`);

        // Verify
        const isCorrect = result.gross_amount === 2500 &&
            result.advances_deducted === 2000 &&
            result.net_amount === 500;

        logTest('Advance Auto-Deduction', isCorrect,
            isCorrect ? 'Correctly deducted ₹2000 advance, net = ₹500' :
                `Expected net=500, got ${result.net_amount}`);

    } catch (error) {
        logTest('Advance Auto-Deduction', false, error.response?.data?.message || error.message);
    }
}

// ============================================================================
// TEST 2: Penalty Auto-Deduction
// ============================================================================
async function testPenaltyDeduction() {
    console.log('\n📝 TEST 2: Penalty Auto-Deduction\n');

    try {
        // Step 1: Record penalty
        console.log('Step 1: Recording penalty of ₹500...');
        const penaltyResponse = await axios.post(`${BASE_URL}/labour/penalties`, {
            labour_id: 2,
            project_id: 1,
            penalty_date: '2024-01-25',
            penalty_type: 'damage',
            amount: 500,
            reason: 'Test penalty - material damage'
        }, headers());

        console.log(`   Penalty recorded: ID ${penaltyResponse.data.data.id}`);

        // Step 2: Record payment (should auto-deduct penalty)
        console.log('Step 2: Recording payment of ₹3000 (should deduct ₹500 penalty)...');
        const paymentResponse = await axios.post(`${BASE_URL}/labour/payments`, {
            labour_id: 2,
            project_id: 1,
            payment_date: '2024-01-26',
            payment_type: 'daily',
            base_amount: 3000,
            overtime_amount: 0,
            bonus_amount: 0,
            payment_method: 'cash',
            notes: 'Test payment with penalty deduction'
        }, headers());

        const result = paymentResponse.data.data;
        console.log(`   Payment recorded: ID ${result.id}`);
        console.log(`   Gross: ₹${result.gross_amount}`);
        console.log(`   Penalties Deducted: ₹${result.penalties_deducted}`);
        console.log(`   Net Payment: ₹${result.net_amount}`);

        // Verify
        const isCorrect = result.gross_amount === 3000 &&
            result.penalties_deducted === 500 &&
            result.net_amount === 2500;

        logTest('Penalty Auto-Deduction', isCorrect,
            isCorrect ? 'Correctly deducted ₹500 penalty, net = ₹2500' :
                `Expected net=2500, got ${result.net_amount}`);

    } catch (error) {
        logTest('Penalty Auto-Deduction', false, error.response?.data?.message || error.message);
    }
}

// ============================================================================
// TEST 3: Duplicate Payment Prevention
// ============================================================================
async function testDuplicatePrevention() {
    console.log('\n📝 TEST 3: Duplicate Payment Prevention\n');

    try {
        const paymentData = {
            labour_id: 3,
            project_id: 1,
            payment_date: '2024-01-27',
            payment_type: 'daily',
            base_amount: 800,
            overtime_amount: 0,
            bonus_amount: 0,
            payment_method: 'cash',
            notes: 'Test duplicate prevention'
        };

        // First payment - should succeed
        console.log('Step 1: Recording first payment...');
        const firstPayment = await axios.post(`${BASE_URL}/labour/payments`, paymentData, headers());
        console.log(`   First payment successful: ID ${firstPayment.data.data.id}`);

        // Second payment - should be blocked
        console.log('Step 2: Attempting duplicate payment...');
        try {
            await axios.post(`${BASE_URL}/labour/payments`, paymentData, headers());
            logTest('Duplicate Payment Prevention', false, 'Duplicate payment was NOT blocked!');
        } catch (error) {
            const errorMsg = error.response?.data?.message || '';
            const isBlocked = errorMsg.includes('Duplicate payment detected');
            console.log(`   Duplicate blocked: ${errorMsg}`);
            logTest('Duplicate Payment Prevention', isBlocked,
                isBlocked ? 'Duplicate correctly blocked' : `Unexpected error: ${errorMsg}`);
        }

    } catch (error) {
        logTest('Duplicate Payment Prevention', false, error.response?.data?.message || error.message);
    }
}

// ============================================================================
// TEST 4: Overpayment Blocking
// ============================================================================
async function testOverpaymentBlocking() {
    console.log('\n📝 TEST 4: Overpayment Blocking\n');

    try {
        // This test assumes we have a booking with known balance
        // We'll try to pay more than the balance
        console.log('Step 1: Attempting overpayment (₹100,000 when balance might be less)...');

        try {
            await axios.post(`${BASE_URL}/payments`, {
                booking_id: 1,
                payment_date: '2024-01-27',
                amount: 100000000, // Huge amount to trigger overpayment
                payment_method: 'bank',
                reference_number: 'TEST-OVP',
                notes: 'Test overpayment blocking'
            }, headers());

            logTest('Overpayment Blocking', false, 'Overpayment was NOT blocked!');
        } catch (error) {
            const errorMsg = error.response?.data?.message || '';
            const isBlocked = errorMsg.includes('Overpayment blocked');
            console.log(`   Response: ${errorMsg}`);
            logTest('Overpayment Blocking', isBlocked,
                isBlocked ? 'Overpayment correctly blocked' : `Unexpected error: ${errorMsg}`);
        }

    } catch (error) {
        logTest('Overpayment Blocking', false, error.message);
    }
}

// ============================================================================
// TEST 5: Inventory Negative Stock Prevention
// ============================================================================
async function testInventoryValidation() {
    console.log('\n📝 TEST 5: Inventory Negative Stock Prevention\n');

    try {
        console.log('Step 1: Attempting stock OUT of 999999 units (should be blocked)...');

        try {
            await axios.post(`${BASE_URL}/inventory/stock-out`, {
                material_id: 1,
                project_id: 1,
                quantity: 999999, // Huge quantity to exceed stock
                reference_type: 'usage',
                usage_reason: 'foundation',
                notes: 'Test negative stock prevention'
            }, headers());

            logTest('Inventory Negative Stock Prevention', false, 'Negative stock was NOT blocked!');
        } catch (error) {
            const errorMsg = error.response?.data?.message || '';
            const isBlocked = errorMsg.includes('Insufficient stock');
            console.log(`   Response: ${errorMsg}`);
            logTest('Inventory Negative Stock Prevention', isBlocked,
                isBlocked ? 'Negative stock correctly blocked' : `Unexpected error: ${errorMsg}`);
        }

    } catch (error) {
        logTest('Inventory Negative Stock Prevention', false, error.message);
    }
}

// ============================================================================
// TEST 6: Combined Advance + Penalty Deduction
// ============================================================================
async function testCombinedDeductions() {
    console.log('\n📝 TEST 6: Combined Advance + Penalty Deduction\n');

    try {
        // Record advance
        console.log('Step 1: Recording advance of ₹1500...');
        await axios.post(`${BASE_URL}/labour/payments`, {
            labour_id: 1,
            project_id: 2,
            payment_date: '2024-01-28',
            payment_type: 'advance',
            base_amount: 1500,
            payment_method: 'cash'
        }, headers());

        // Record penalty
        console.log('Step 2: Recording penalty of ₹300...');
        await axios.post(`${BASE_URL}/labour/penalties`, {
            labour_id: 1,
            project_id: 2,
            penalty_date: '2024-01-28',
            penalty_type: 'late',
            amount: 300,
            reason: 'Test penalty - late arrival'
        }, headers());

        // Record payment (should deduct both)
        console.log('Step 3: Recording payment of ₹4000 (should deduct ₹1500 + ₹300 = ₹1800)...');
        const paymentResponse = await axios.post(`${BASE_URL}/labour/payments`, {
            labour_id: 1,
            project_id: 2,
            payment_date: '2024-01-29',
            payment_type: 'daily',
            base_amount: 4000,
            payment_method: 'cash'
        }, headers());

        const result = paymentResponse.data.data;
        console.log(`   Gross: ₹${result.gross_amount}`);
        console.log(`   Advances: ₹${result.advances_deducted}`);
        console.log(`   Penalties: ₹${result.penalties_deducted}`);
        console.log(`   Total Deductions: ₹${result.deduction_amount}`);
        console.log(`   Net: ₹${result.net_amount}`);

        const isCorrect = result.gross_amount === 4000 &&
            result.advances_deducted === 1500 &&
            result.penalties_deducted === 300 &&
            result.deduction_amount === 1800 &&
            result.net_amount === 2200;

        logTest('Combined Advance + Penalty', isCorrect,
            isCorrect ? 'Both deductions applied correctly, net = ₹2200' :
                `Expected net=2200, got ${result.net_amount}`);

    } catch (error) {
        logTest('Combined Advance + Penalty', false, error.response?.data?.message || error.message);
    }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================
async function runAllTests() {
    console.log('🚀 STARTING HARD TESTING - CRITICAL FIXES\n');
    console.log('='.repeat(60));

    const loggedIn = await login();
    if (!loggedIn) {
        console.log('\n❌ Cannot proceed without authentication');
        return;
    }

    await testAdvanceDeduction();
    await testPenaltyDeduction();
    await testDuplicatePrevention();
    await testOverpaymentBlocking();
    await testInventoryValidation();
    await testCombinedDeductions();

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY\n');
    console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

    if (testResults.failed > 0) {
        console.log('\n⚠️  FAILED TESTS:');
        testResults.tests.filter(t => !t.passed).forEach(t => {
            console.log(`   - ${t.name}: ${t.details}`);
        });
    }

    console.log('\n' + '='.repeat(60));
    console.log(testResults.failed === 0 ? '✅ ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED');
}

runAllTests().then(() => {
    console.log('\n✅ Testing complete');
    process.exit(0);
}).catch(error => {
    console.error('\n❌ Testing failed:', error);
    process.exit(1);
});
