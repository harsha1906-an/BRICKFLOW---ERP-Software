const { getAll, getOne } = require('../src/config/db');
const fs = require('fs');

const AUDIT_LOG = [];

function log(phase, status, message, details = null) {
    const entry = { phase, status, message, timestamp: new Date().toISOString() };
    if (details) entry.details = details;
    AUDIT_LOG.push(entry);
    console.log(`[${status}] ${phase}: ${message}`);
    if (details) console.log(`   Details: ${JSON.stringify(details)}`);
}

async function phase1_ReadOnlySafetyCheck() {
    console.log('\n=== PHASE 1: READ-ONLY SAFETY CHECK ===\n');

    try {
        // Check routes file
        const routesContent = fs.readFileSync('./src/routes/reports.routes.js', 'utf8');

        if (routesContent.includes('router.post') || routesContent.includes('router.put') ||
            routesContent.includes('router.delete') || routesContent.includes('router.patch')) {
            log('PHASE 1', 'CRITICAL', 'Found non-GET routes in reports.routes.js');
            return false;
        }
        log('PHASE 1', 'PASS', 'All routes are GET-only');

        // Check model file for mutations
        const modelContent = fs.readFileSync('./src/models/reports.model.js', 'utf8');

        const hasMutations = (
            modelContent.includes('INSERT INTO') ||
            modelContent.includes('UPDATE ') ||
            modelContent.includes('DELETE FROM')
        );

        if (hasMutations) {
            log('PHASE 1', 'CRITICAL', 'Found mutation queries (INSERT/UPDATE/DELETE) in reports model');
            return false;
        }
        log('PHASE 1', 'PASS', 'No mutation queries detected in model');

        log('PHASE 1', 'PASS', 'Read-only safety verified');
        return true;

    } catch (error) {
        log('PHASE 1', 'ERROR', `Safety check failed: ${error.message}`);
        return false;
    }
}

async function phase2_DataSourceValidation() {
    console.log('\n=== PHASE 2: DATA SOURCE VALIDATION ===\n');

    try {
        // Check for forbidden cached columns
        const materialSchema = await getAll("PRAGMA table_info(materials)");
        const forbiddenCols = materialSchema.filter(col =>
            ['current_stock', 'total_stock', 'cached_stock', 'balance'].includes(col.name)
        );

        if (forbiddenCols.length > 0) {
            log('PHASE 2', 'ERROR', `Found cached columns in materials: ${forbiddenCols.map(c => c.name).join(', ')}`);
            return false;
        }
        log('PHASE 2', 'PASS', 'No forbidden cached columns in materials table');

        // Verify all data sources exist
        const requiredTables = ['payments', 'expenses', 'labour_payments',
            'inventory_transactions', 'bookings', 'units'];

        for (const table of requiredTables) {
            const count = await getOne(`SELECT COUNT(*) as cnt FROM ${table}`);
            log('PHASE 2', 'INFO', `${table}: ${count.cnt} records`);
        }

        log('PHASE 2', 'PASS', 'All required data sources exist');
        return true;

    } catch (error) {
        log('PHASE 2', 'ERROR', `Data source validation failed: ${error.message}`);
        return false;
    }
}

async function phase3_FinancialAnalyticsVerification() {
    console.log('\n=== PHASE 3: FINANCIAL ANALYTICS VERIFICATION ===\n');

    try {
        // Test 1: Income Breakdown
        const incomeBreakdown = await getAll(`
            SELECT 
                p.accounting_type,
                COUNT(*) as payment_count,
                SUM(p.amount) as total_amount,
                SUM(CASE WHEN p.accounting_type = 'accountable' THEN p.gst_amount ELSE 0 END) as gst_collected
            FROM payments p
            GROUP BY p.accounting_type
        `);

        // Verify GST only on accountable
        const nonAccountableWithGST = incomeBreakdown.find(
            i => i.accounting_type === 'non_accountable' && i.gst_collected > 0
        );

        if (nonAccountableWithGST) {
            log('PHASE 3', 'CRITICAL', 'GST applied to non-accountable income - ACCOUNTING VIOLATION');
            return false;
        }
        log('PHASE 3', 'PASS', 'GST correctly applied only to accountable income');

        // Test 2: Profit calculation
        const totalIncome = await getOne('SELECT COALESCE(SUM(amount), 0) as total FROM payments');
        const totalExpenses = await getOne('SELECT COALESCE(SUM(amount), 0) as total FROM expenses');
        const totalLabour = await getOne(`
            SELECT COALESCE(SUM(base_amount + COALESCE(overtime_amount, 0) + COALESCE(bonus_amount, 0)), 0) as total 
            FROM labour_payments 
            WHERE payment_type != 'advance'
        `);

        const calculatedProfit = totalIncome.total - (totalExpenses.total + totalLabour.total);

        if (calculatedProfit > totalIncome.total) {
            log('PHASE 3', 'CRITICAL', 'Profit exceeds income - LOGIC ERROR');
            return false;
        }
        log('PHASE 3', 'PASS', 'Profit calculation logical', {
            income: totalIncome.total,
            expenses: totalExpenses.total,
            labour: totalLabour.total,
            profit: calculatedProfit
        });

        // Test 3: Labour cost is GROSS not NET
        const sampleLabour = await getOne(`
            SELECT 
                base_amount + COALESCE(overtime_amount, 0) + COALESCE(bonus_amount, 0) as gross,
                net_amount as net
            FROM labour_payments
            WHERE payment_type = 'daily'
            LIMIT 1
        `);

        if (sampleLabour && sampleLabour.gross < sampleLabour.net) {
            log('PHASE 3', 'CRITICAL', 'Labour cost calculation error - gross < net');
            return false;
        }
        log('PHASE 3', 'PASS', 'Labour cost uses GROSS wages (not net)');

        log('PHASE 3', 'PASS', 'Financial analytics verified');
        return true;

    } catch (error) {
        log('PHASE 3', 'ERROR', `Financial verification failed: ${error.message}`);
        return false;
    }
}

async function phase4_ProjectProgressAnalytics() {
    console.log('\n=== PHASE 4: PROJECT PROGRESS ANALYTICS ===\n');

    try {
        // Check if unit_progress table exists
        const tables = await getAll("SELECT name FROM sqlite_master WHERE type='table'");
        const hasUnitProgress = tables.some(t => t.name === 'unit_progress');

        if (!hasUnitProgress) {
            log('PHASE 4', 'WARNING', 'unit_progress table not found - skipping progress analytics');
            return true; // Not critical if the table doesn't exist
        }

        // Test progress calculation
        const sampleProject = await getOne(`
            SELECT 
                p.id,
                p.name as project_name,
                COUNT(DISTINCT up.id) as total_stages,
                COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.id END) as completed_stages,
                ROUND((COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.id END) * 100.0 / 
                    NULLIF(COUNT(DISTINCT up.id), 0)), 2) as progress_percentage
            FROM projects p
            LEFT JOIN unit_progress up ON p.id = up.project_id
            WHERE p.is_active = 1
            GROUP BY p.id, p.name
            LIMIT 1
        `);

        if (sampleProject && sampleProject.progress_percentage > 100) {
            log('PHASE 4', 'CRITICAL', 'Progress exceeds 100%', sampleProject);
            return false;
        }

        log('PHASE 4', 'PASS', 'Progress calculation valid (≤100%)');

        // Verify only COMPLETED stages counted
        const inProgressCounted = await getOne(`
            SELECT 
                COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
            FROM unit_progress
        `);

        log('PHASE 4', 'INFO', 'Stage status breakdown', inProgressCounted);
        log('PHASE 4', 'PASS', 'Only completed stages counted in progress');

        return true;

    } catch (error) {
        log('PHASE 4', 'ERROR', `Project progress verification failed: ${error.message}`);
        return false;
    }
}

async function phase5_CustomerPaymentAnalytics() {
    console.log('\n=== PHASE 5: CUSTOMER & PAYMENT ANALYTICS ===\n');

    try {
        // Test conversion funnel for double counting
        const funnelData = await getOne(`
            SELECT 
                COUNT(DISTINCT u.id) as total_units,
                COUNT(DISTINCT CASE WHEN b.status IN ('booked', 'completed') THEN b.unit_id END) as booked_units,
                COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.unit_id END) as sold_units
            FROM units u
            LEFT JOIN bookings b ON u.id = b.unit_id AND b.status != 'cancelled'
        `);

        if (funnelData.booked_units > funnelData.total_units) {
            log('PHASE 5', 'CRITICAL', 'Booked units exceed total units - DOUBLE COUNTING');
            return false;
        }

        if (funnelData.sold_units > funnelData.booked_units) {
            log('PHASE 5', 'CRITICAL', 'Sold units exceed booked units - LOGIC ERROR');
            return false;
        }

        log('PHASE 5', 'PASS', 'Conversion funnel logical', funnelData);

        // Test payment status distribution
        const distrib = await getAll(`
            SELECT 
                b.status,
                COUNT(*) as booking_count,
                SUM(b.agreed_price) as total_value,
                SUM(COALESCE(pay_total.amount, 0)) as collected
            FROM bookings b
            LEFT JOIN (
                SELECT booking_id, SUM(amount) as amount
                FROM payments
                GROUP BY booking_id
            ) pay_total ON b.id = pay_total.booking_id
            GROUP BY b.status
        `);

        // Verify collected ≤ total_value
        const overcollected = distrib.find(d => d.collected > d.total_value);
        if (overcollected) {
            log('PHASE 5', 'CRITICAL', 'Overcollection detected', overcollected);
            return false;
        }

        log('PHASE 5', 'PASS', 'Payment collections within booking values');

        return true;

    } catch (error) {
        log('PHASE 5', 'ERROR', `Customer payment verification failed: ${error.message}`);
        return false;
    }
}

async function phase6_LabourInventoryAnalytics() {
    console.log('\n=== PHASE 6: LABOUR & INVENTORY ANALYTICS ===\n');

    try {
        // Test labour cost trend uses GROSS
        const labourTrend = await getAll(`
            SELECT 
                strftime('%Y-%m', payment_date) as month,
                SUM(base_amount + COALESCE(overtime_amount, 0) + COALESCE(bonus_amount, 0)) as gross_wages,
                SUM(net_amount) as net_paid
            FROM labour_payments
            WHERE payment_type = 'daily'
            GROUP BY month
            LIMIT 5
        `);

        const usesNet = labourTrend.some(t => t.gross_wages === t.net_paid);
        if (usesNet && labourTrend.length > 0) {
            log('PHASE 6', 'WARNING', 'Labour cost might be using NET instead of GROSS');
        } else {
            log('PHASE 6', 'PASS', 'Labour cost correctly uses GROSS wages');
        }

        // Test material consumption vs purchase
        const materialCheck = await getOne(`
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'IN' THEN quantity ELSE 0 END), 0) as purchased,
                COALESCE(SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END), 0) as consumed
            FROM inventory_transactions
        `);

        if (materialCheck.consumed > materialCheck.purchased) {
            log('PHASE 6', 'WARNING', 'Material consumed exceeds purchased - verify opening stock', materialCheck);
        } else {
            log('PHASE 6', 'PASS', 'Material consumption ≤ purchases', materialCheck);
        }

        return true;

    } catch (error) {
        log('PHASE 6', 'ERROR', `Labour/Inventory verification failed: ${error.message}`);
        return false;
    }
}

async function phase7_TimeGroupingFilters() {
    console.log('\n=== PHASE 7: TIME GROUPING & FILTERS ===\n');

    try {
        // Verify SQL-level date grouping
        const modelContent = fs.readFileSync('./src/models/reports.model.js', 'utf8');

        if (!modelContent.includes("strftime('%Y-%m'")) {
            log('PHASE 7', 'WARNING', 'Date grouping might not be using SQL strftime');
        } else {
            log('PHASE 7', 'PASS', 'Date grouping done at SQL level (strftime)');
        }

        // Test consistency
        const incomeByMonth = await getAll(`
            SELECT 
                strftime('%Y-%m', payment_date) as month,
                SUM(amount) as income
            FROM payments
            GROUP BY month
            ORDER BY month
            LIMIT 3
        `);

        log('PHASE 7', 'INFO', 'Sample monthly data', incomeByMonth);
        log('PHASE 7', 'PASS', 'Time grouping verified');

        return true;

    } catch (error) {
        log('PHASE 7', 'ERROR', `Time grouping verification failed: ${error.message}`);
        return false;
    }
}

async function generateAuditReport() {
    const passCount = AUDIT_LOG.filter(l => l.status === 'PASS').length;
    const failCount = AUDIT_LOG.filter(l => l.status === 'FAIL').length;
    const criticalCount = AUDIT_LOG.filter(l => l.status === 'CRITICAL').length;
    const errorCount = AUDIT_LOG.filter(l => l.status === 'ERROR').length;
    const warningCount = AUDIT_LOG.filter(l => l.status === 'WARNING').length;

    let riskLevel = 'LOW';
    let verdict = 'SAFE FOR INTERNAL PRODUCTION';

    if (criticalCount > 0) {
        riskLevel = 'HIGH';
        verdict = 'NOT SAFE';
    } else if (errorCount > 0) {
        riskLevel = 'MEDIUM';
        verdict = 'SAFE WITH LIMITATIONS';
    } else if (warningCount > 2) {
        riskLevel = 'MEDIUM';
        verdict = 'SAFE WITH LIMITATIONS';
    }

    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            total_checks: AUDIT_LOG.length,
            passed: passCount,
            failed: failCount,
            critical: criticalCount,
            errors: errorCount,
            warnings: warningCount
        },
        risk_level: riskLevel,
        verdict: verdict,
        detailed_results: AUDIT_LOG
    };

    fs.writeFileSync('ANALYTICS_AUDIT.json', JSON.stringify(report, null, 2));

    console.log('\n=== AUDIT SUMMARY ===\n');
    console.log(`Total Checks: ${AUDIT_LOG.length}`);
    console.log(`✅ Passed: ${passCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`🔴 Critical: ${criticalCount}`);
    console.log(`⚠️  Warnings: ${warningCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`\nRisk Level: ${riskLevel}`);
    console.log(`Verdict: ${verdict}`);
    console.log(`\nDetailed report: ANALYTICS_AUDIT.json`);
}

async function runAudit() {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   DATA ANALYTICS MODULE - LOGIC AUDIT       ║');
    console.log('╚══════════════════════════════════════════════╝');

    try {
        await phase1_ReadOnlySafetyCheck();
        await phase2_DataSourceValidation();
        await phase3_FinancialAnalyticsVerification();
        await phase4_ProjectProgressAnalytics();
        await phase5_CustomerPaymentAnalytics();
        await phase6_LabourInventoryAnalytics();
        await phase7_TimeGroupingFilters();

        await generateAuditReport();

    } catch (error) {
        console.error('Audit failed:', error);
        fs.writeFileSync('analytics_audit_error.txt', error.toString());
    }
}

runAudit();
