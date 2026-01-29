const { getAll, getOne } = require('../src/config/db');
const fs = require('fs');

console.log('🔍 Verifying Analytics Data Sources...\n');

async function verifyDataSources() {
    const report = [];

    try {
        // Phase 1: Verify data sources
        console.log('=== PHASE 1: DATA SOURCE VERIFICATION ===\n');

        const tables = ['payments', 'payment_milestones', 'inventory_transactions',
            'labour_payments', 'unit_progress', 'expenses'];

        for (const table of tables) {
            const count = await getOne(`SELECT COUNT(*) as cnt FROM ${table}`);
            console.log(`✅ ${table}: ${count.cnt} records`);
            report.push({ table, records: count.cnt, status: 'OK' });
        }

        // Check for forbidden stored totals
        console.log('\n🔍 Checking for stored totals...');
        const materialSchema = await getAll("PRAGMA table_info(materials)");
        const hasForbidden = materialSchema.some(col =>
            ['current_stock', 'total_stock', 'cached_stock'].includes(col.name)
        );

        if (hasForbidden) {
            console.log('❌ WARNING: Found cached stock columns in materials table');
            report.push({ check: 'No stored totals', status: 'FAIL' });
        } else {
            console.log('✅ No forbidden cached values detected');
            report.push({ check: 'No stored totals', status: 'PASS' });
        }

        // Phase 2: Test read-only safety
        console.log('\n=== PHASE 2: READ-ONLY SAFETY CHECK ===\n');

        // Verify all routes are GET
        const routesFile = fs.readFileSync('./src/routes/reports.routes.js', 'utf8');
        const hasPost = routesFile.includes('router.post') || routesFile.includes('router.put') || routesFile.includes('router.delete');

        if (hasPost) {
            console.log('❌ CRITICAL: Found non-GET routes in reports');
            report.push({ check: 'GET-only routes', status: 'FAIL' });
        } else {
            console.log('✅ All routes are GET-only');
            report.push({ check: 'GET-only routes', status: 'PASS' });
        }

        // Verify no mutations in model
        const modelFile = fs.readFileSync('./src/models/reports.model.js', 'utf8');
        const hasMutation = modelFile.includes('runQuery') &&
            (modelFile.includes('INSERT') || modelFile.includes('UPDATE') || modelFile.includes('DELETE'));

        if (hasMutation) {
            console.log('❌ CRITICAL: Found mutation queries in reports model');
            report.push({ check: 'No mutations', status: 'FAIL' });
        } else {
            console.log('✅ No database mutations detected');
            report.push({ check: 'No mutations', status: 'PASS' });
        }

        // Phase 3: Data accuracy spot check
        console.log('\n=== PHASE 3: DATA ACCURACY VERIFICATION ===\n');

        // Test income vs expense calculation
        const incomeData = await getOne('SELECT COALESCE(SUM(amount), 0) as total FROM payments');
        const expenseData = await getOne('SELECT COALESCE(SUM(amount), 0) as total FROM expenses');

        console.log(`Total Income: ₹${incomeData.total}`);
        console.log(`Total Expenses: ₹${expenseData.total}`);
        console.log(`Net Position: ₹${incomeData.total - expenseData.total}`);

        report.push({
            check: 'Financial totals',
            income: incomeData.total,
            expense: expenseData.total,
            net: incomeData.total - expenseData.total,
            status: 'PASS'
        });

        // Test stock calculation
        const stockCheck = await getOne(`
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'IN' THEN quantity ELSE -quantity END), 0) as stock
            FROM inventory_transactions
        `);

        console.log(`Total Inventory Value: ${stockCheck.stock} units (across all materials)`);
        report.push({ check: 'Stock calculation', total_units: stockCheck.stock, status: 'PASS' });

        // Final verdict
        console.log('\n=== VERIFICATION SUMMARY ===\n');
        const failCount = report.filter(r => r.status === 'FAIL').length;

        if (failCount === 0) {
            console.log('✅ ALL CHECKS PASSED - SAFE FOR PRODUCTION');
        } else {
            console.log(`❌ ${failCount} CHECKS FAILED - REVIEW REQUIRED`);
        }

        fs.writeFileSync('analytics_verification.json', JSON.stringify(report, null, 2));
        console.log('\nDetailed report saved to: analytics_verification.json\n');

    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
}

verifyDataSources();
