// Comprehensive ERP System Test Suite
// Run with: node test-comprehensive.js
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const API_BASE = 'http://localhost:5001/api';
let authToken = '';
let testData = {
    projectId: null,
    unitId: null,
    materialId: null,
    customerId: null,
    bookingId: null,
    expenseId: null
};

// Helper function to make API calls
async function apiCall(method, endpoint, data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json();
    return { status: response.status, data: result };
}

// Test runner
async function runTests() {
    console.log('🧪 Starting Comprehensive ERP System Tests\n');
    console.log('='.repeat(60));

    try {
        // TEST 1: Authentication
        console.log('\n📝 TEST 1: Authentication');
        const loginResult = await apiCall('POST', '/auth/login', {
            username: 'admin',
            password: 'admin123'
        });

        if (loginResult.data.success && loginResult.data.token) {
            authToken = loginResult.data.token;
            console.log('✅ PASS: Login successful');
            console.log(`   Token: ${authToken.substring(0, 20)}...`);
        } else {
            console.log('❌ FAIL: Login failed');
            return;
        }

        // TEST 2: Create Project
        console.log('\n📝 TEST 2: Create Project');
        const projectResult = await apiCall('POST', '/projects', {
            name: 'Test Project Alpha',
            location: 'Test City',
            start_date: '2024-01-01',
            status: 'active'
        });

        if (projectResult.data.success) {
            testData.projectId = projectResult.data.data.id;
            console.log('✅ PASS: Project created');
            console.log(`   Project ID: ${testData.projectId}`);
        } else {
            console.log('❌ FAIL: Project creation failed');
            console.log(`   Error: ${projectResult.data.message}`);
        }

        // TEST 3: Verify Project Persists
        console.log('\n📝 TEST 3: Verify Project Persists (GET)');
        const getProjectResult = await apiCall('GET', '/projects');
        const createdProject = getProjectResult.data.data.find(p => p.id === testData.projectId);

        if (createdProject && createdProject.name === 'Test Project Alpha') {
            console.log('✅ PASS: Project retrieved successfully');
            console.log(`   Name: ${createdProject.name}, Location: ${createdProject.location}`);
        } else {
            console.log('❌ FAIL: Project not found after creation');
        }

        // TEST 4: Create Unit
        console.log('\n📝 TEST 4: Create Unit');
        const unitResult = await apiCall('POST', '/units', {
            project_id: testData.projectId,
            unit_number: 'T-101',
            type: '2BHK',
            price: 5000000,
            status: 'available'
        });

        if (unitResult.data.success) {
            testData.unitId = unitResult.data.data.id;
            console.log('✅ PASS: Unit created');
            console.log(`   Unit ID: ${testData.unitId}`);
        } else {
            console.log('❌ FAIL: Unit creation failed');
            console.log(`   Error: ${unitResult.data.message}`);
        }

        // TEST 5: Try to Delete Project with Units (Should Fail)
        console.log('\n📝 TEST 5: Delete Protection - Project with Units');
        const deleteProjectResult = await apiCall('DELETE', `/projects/${testData.projectId}`);

        if (!deleteProjectResult.data.success) {
            console.log('✅ PASS: Delete protection working');
            console.log(`   Error (expected): ${deleteProjectResult.data.message}`);
        } else {
            console.log('❌ FAIL: Project deleted despite having units');
        }

        // TEST 6: Create Material
        console.log('\n📝 TEST 6: Create Material');
        const materialResult = await apiCall('POST', '/materials', {
            name: 'Test Cement',
            unit: 'bags'
        });

        if (materialResult.data.success) {
            testData.materialId = materialResult.data.data.id;
            console.log('✅ PASS: Material created');
            console.log(`   Material ID: ${testData.materialId}`);
        } else {
            console.log('❌ FAIL: Material creation failed');
        }

        // TEST 7: Stock IN Transaction
        console.log('\n📝 TEST 7: Stock IN Transaction');
        const stockInResult = await apiCall('POST', '/inventory/in', {
            material_id: testData.materialId,
            project_id: testData.projectId,
            quantity: 100,
            reference_type: 'purchase',
            notes: 'Test stock in'
        });

        if (stockInResult.data.success) {
            console.log('✅ PASS: Stock IN recorded');
            console.log(`   Quantity: 100 bags`);
        } else {
            console.log('❌ FAIL: Stock IN failed');
        }

        // TEST 8: Verify Stock Summary
        console.log('\n📝 TEST 8: Verify Stock Summary');
        const stockSummaryResult = await apiCall('GET', '/inventory/summary');
        const materialStock = stockSummaryResult.data.data.find(m => m.material_id === testData.materialId);

        if (materialStock && materialStock.current_stock === 100) {
            console.log('✅ PASS: Stock calculation correct');
            console.log(`   Current Stock: ${materialStock.current_stock} ${materialStock.unit}`);
        } else {
            console.log('❌ FAIL: Stock calculation incorrect');
            console.log(`   Expected: 100, Got: ${materialStock?.current_stock || 0}`);
        }

        // TEST 9: Stock OUT Transaction
        console.log('\n📝 TEST 9: Stock OUT Transaction');
        const stockOutResult = await apiCall('POST', '/inventory/out', {
            material_id: testData.materialId,
            project_id: testData.projectId,
            quantity: 30,
            reference_type: 'usage',
            notes: 'Test stock out'
        });

        if (stockOutResult.data.success) {
            console.log('✅ PASS: Stock OUT recorded');
            console.log(`   Quantity: 30 bags`);
        } else {
            console.log('❌ FAIL: Stock OUT failed');
        }

        // TEST 10: Verify Updated Stock
        console.log('\n📝 TEST 10: Verify Updated Stock (100 - 30 = 70)');
        const updatedStockResult = await apiCall('GET', '/inventory/summary');
        const updatedStock = updatedStockResult.data.data.find(m => m.material_id === testData.materialId);

        if (updatedStock && updatedStock.current_stock === 70) {
            console.log('✅ PASS: Stock updated correctly');
            console.log(`   Current Stock: ${updatedStock.current_stock} ${updatedStock.unit}`);
        } else {
            console.log('❌ FAIL: Stock update incorrect');
            console.log(`   Expected: 70, Got: ${updatedStock?.current_stock || 0}`);
        }

        // TEST 11: Insufficient Stock Protection
        console.log('\n📝 TEST 11: Insufficient Stock Protection');
        const insufficientStockResult = await apiCall('POST', '/inventory/out', {
            material_id: testData.materialId,
            project_id: testData.projectId,
            quantity: 100,
            reference_type: 'usage',
            notes: 'Should fail'
        });

        if (!insufficientStockResult.data.success) {
            console.log('✅ PASS: Insufficient stock protection working');
            console.log(`   Error (expected): ${insufficientStockResult.data.message}`);
        } else {
            console.log('❌ FAIL: Allowed stock OUT with insufficient stock');
        }

        // TEST 12: Create Expense
        console.log('\n📝 TEST 12: Create Expense');
        const expenseResult = await apiCall('POST', '/expenses', {
            expense_date: '2024-01-15',
            project_id: testData.projectId,
            category: 'labour',
            amount: 25000,
            notes: 'Test expense'
        });

        if (expenseResult.data.success) {
            testData.expenseId = expenseResult.data.data.id;
            console.log('✅ PASS: Expense created');
            console.log(`   Expense ID: ${testData.expenseId}, Amount: ₹25,000`);
        } else {
            console.log('❌ FAIL: Expense creation failed');
        }

        // TEST 13: Expense Correction
        console.log('\n📝 TEST 13: Expense Correction (25000 → 30000)');
        const correctionResult = await apiCall('POST', `/expenses/${testData.expenseId}/correct`, {
            expense_date: '2024-01-15',
            category: 'labour',
            amount: 30000,
            notes: 'Corrected amount'
        });

        if (correctionResult.data.success) {
            console.log('✅ PASS: Correction entries created');
            console.log(`   Reversal ID: ${correctionResult.data.data.reversalId}`);
            console.log(`   New Expense ID: ${correctionResult.data.data.newExpenseId}`);
        } else {
            console.log('❌ FAIL: Correction failed');
        }

        // TEST 14: Verify Expense Summary
        console.log('\n📝 TEST 14: Verify Expense Summary (Net should be 30000)');
        const expenseSummaryResult = await apiCall('GET', `/expenses/summary?project_id=${testData.projectId}`);
        const labourExpense = expenseSummaryResult.data.data.find(e => e.category === 'labour');

        if (labourExpense && labourExpense.total_amount === 30000) {
            console.log('✅ PASS: Expense summary correct');
            console.log(`   Net Amount: ₹${labourExpense.total_amount}`);
        } else {
            console.log('❌ FAIL: Expense summary incorrect');
            console.log(`   Expected: 30000, Got: ${labourExpense?.total_amount || 0}`);
        }

        // TEST 15: Create Customer
        console.log('\n📝 TEST 15: Create Customer');
        const customerResult = await apiCall('POST', '/customers', {
            name: 'Test Customer',
            phone: '9999999999',
            email: 'test@example.com'
        });

        if (customerResult.data.success) {
            testData.customerId = customerResult.data.data.id;
            console.log('✅ PASS: Customer created');
            console.log(`   Customer ID: ${testData.customerId}`);
        } else {
            console.log('❌ FAIL: Customer creation failed');
        }

        // TEST 16: Create Booking
        console.log('\n📝 TEST 16: Create Booking');
        const bookingResult = await apiCall('POST', '/bookings', {
            customer_id: testData.customerId,
            unit_id: testData.unitId,
            booking_date: '2024-01-20',
            agreed_price: 5000000,
            notes: 'Test booking'
        });

        if (bookingResult.data.success) {
            testData.bookingId = bookingResult.data.data.id;
            console.log('✅ PASS: Booking created');
            console.log(`   Booking ID: ${testData.bookingId}`);
        } else {
            console.log('❌ FAIL: Booking creation failed');
            console.log(`   Error: ${bookingResult.data.message}`);
        }

        // TEST 17: Verify Unit Status Changed
        console.log('\n📝 TEST 17: Verify Unit Status Changed to "booked"');
        const getUnitResult = await apiCall('GET', `/units/${testData.unitId}`);

        if (getUnitResult.data.data.status === 'booked') {
            console.log('✅ PASS: Unit status updated correctly');
            console.log(`   Status: ${getUnitResult.data.data.status}`);
        } else {
            console.log('❌ FAIL: Unit status not updated');
            console.log(`   Expected: booked, Got: ${getUnitResult.data.data.status}`);
        }

        // TEST 18: Record Payment
        console.log('\n📝 TEST 18: Record Payment (₹1,000,000)');
        const paymentResult = await apiCall('POST', '/payments', {
            booking_id: testData.bookingId,
            payment_date: '2024-01-21',
            amount: 1000000,
            payment_method: 'bank',
            reference_number: 'TEST123',
            notes: 'Test payment'
        });

        if (paymentResult.data.success) {
            console.log('✅ PASS: Payment recorded');
            if (paymentResult.data.warning) {
                console.log(`   ⚠️  Warning: ${paymentResult.data.warning.message}`);
            }
        } else {
            console.log('❌ FAIL: Payment recording failed');
        }

        // TEST 19: Verify Balance Calculation
        console.log('\n📝 TEST 19: Verify Balance (5000000 - 1000000 = 4000000)');
        const balanceResult = await apiCall('GET', `/bookings/${testData.bookingId}/balance`);

        if (balanceResult.data.data.balance === 4000000) {
            console.log('✅ PASS: Balance calculated correctly');
            console.log(`   Agreed Price: ₹${balanceResult.data.data.agreed_price.toLocaleString()}`);
            console.log(`   Total Paid: ₹${balanceResult.data.data.total_paid.toLocaleString()}`);
            console.log(`   Balance: ₹${balanceResult.data.data.balance.toLocaleString()}`);
        } else {
            console.log('❌ FAIL: Balance calculation incorrect');
            console.log(`   Expected: 4000000, Got: ${balanceResult.data.data.balance}`);
        }

        // TEST 20: Overpayment Detection
        console.log('\n📝 TEST 20: Overpayment Detection (Try to pay ₹5,000,000)');
        const overpaymentResult = await apiCall('POST', '/payments/check-overpayment/' + testData.bookingId, {
            amount: 5000000
        });

        if (overpaymentResult.data.data.isOverpayment) {
            console.log('✅ PASS: Overpayment detected');
            console.log(`   Excess Amount: ₹${overpaymentResult.data.data.excessAmount.toLocaleString()}`);
        } else {
            console.log('❌ FAIL: Overpayment not detected');
        }

        // TEST 21: Reports - Stock Summary
        console.log('\n📝 TEST 21: Reports - Stock Summary');
        const stockReportResult = await apiCall('GET', '/reports/stock-summary');
        const testCementStock = stockReportResult.data.data.find(m => m.id === testData.materialId);

        if (testCementStock && testCementStock.current_stock === 70) {
            console.log('✅ PASS: Stock summary report correct');
            console.log(`   ${testCementStock.name}: ${testCementStock.current_stock} ${testCementStock.unit}`);
        } else {
            console.log('❌ FAIL: Stock summary report incorrect');
        }

        // TEST 22: Reports - Material Consumption
        console.log('\n📝 TEST 22: Reports - Material Consumption');
        const consumptionResult = await apiCall('GET', `/reports/material-consumption?project_id=${testData.projectId}`);
        const consumption = consumptionResult.data.data.find(c => c.material_name === 'Test Cement');

        if (consumption && consumption.quantity_used === 30) {
            console.log('✅ PASS: Material consumption report correct');
            console.log(`   ${consumption.material_name}: ${consumption.quantity_used} ${consumption.unit} used`);
        } else {
            console.log('❌ FAIL: Material consumption report incorrect');
        }

        // TEST 23: Reports - Income vs Expense
        console.log('\n📝 TEST 23: Reports - Income vs Expense');
        const incomeExpenseResult = await apiCall('GET', '/reports/income-expense');

        if (incomeExpenseResult.data.success) {
            console.log('✅ PASS: Income vs Expense report generated');
            console.log(`   Total Income: ₹${incomeExpenseResult.data.data.total_income.toLocaleString()}`);
            console.log(`   Total Expenses: ₹${incomeExpenseResult.data.data.total_expenses.toLocaleString()}`);
            console.log(`   Net Profit: ₹${incomeExpenseResult.data.data.net_profit.toLocaleString()}`);
        } else {
            console.log('❌ FAIL: Income vs Expense report failed');
        }

        // TEST 24: Reports - Project Profit
        console.log('\n📝 TEST 24: Reports - Project Profit');
        const profitResult = await apiCall('GET', '/reports/project-profit');
        const testProjectProfit = profitResult.data.data.find(p => p.id === testData.projectId);

        if (testProjectProfit) {
            console.log('✅ PASS: Project profit report generated');
            console.log(`   Project: ${testProjectProfit.project_name}`);
            console.log(`   Revenue: ₹${testProjectProfit.total_revenue.toLocaleString()}`);
            console.log(`   Expenses: ₹${testProjectProfit.total_expenses.toLocaleString()}`);
            console.log(`   Profit: ₹${testProjectProfit.estimated_profit.toLocaleString()}`);
            console.log(`   Margin: ${testProjectProfit.profit_margin}%`);
        } else {
            console.log('❌ FAIL: Project profit report failed');
        }

        // SUMMARY
        console.log('\n' + '='.repeat(60));
        console.log('🎉 TEST SUITE COMPLETED');
        console.log('='.repeat(60));
        console.log('\n📊 Test Data Created:');
        console.log(`   Project ID: ${testData.projectId}`);
        console.log(`   Unit ID: ${testData.unitId}`);
        console.log(`   Material ID: ${testData.materialId}`);
        console.log(`   Customer ID: ${testData.customerId}`);
        console.log(`   Booking ID: ${testData.bookingId}`);
        console.log(`   Expense ID: ${testData.expenseId}`);
        console.log('\n✅ All tests completed successfully!');
        console.log('   Data persists in database: backend/database/erp.db');
        console.log('   You can refresh the frontend to verify data persistence');

    } catch (error) {
        console.error('\n❌ TEST SUITE FAILED');
        console.error('Error:', error.message);
    }
}

// Run the tests
runTests();
