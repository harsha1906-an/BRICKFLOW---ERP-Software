const Labour = require('../src/models/labour.model');
const Reports = require('../src/models/reports.model');
const { runQuery } = require('../src/config/db');

// Explicit async execution wrapper
(async () => {
    try {
        console.log('🧪 Starting Report Logic Verification...');

        // 1. Setup Project
        console.log('Creating Project...');
        const rand = Math.floor(Math.random() * 10000);
        const projName = `RepTest-${rand}`;
        const pRes = await runQuery("INSERT INTO projects (name, status, created_by) VALUES (?, 'ongoing', 1)", [projName]);
        const projId = pRes.id;
        console.log(`Project Created: ${projId}`);

        // 2. Setup Labour
        console.log('Creating Labour...');
        const workerName = `Worker-${rand}`;
        const lRes = await Labour.create({
            name: workerName, type: 'Mason', gender: 'M', phone: '123', address: 'X', employment_type: 'daily', skill_level: 'skilled', daily_wage: 500
        });
        const labId = lRes.id || lRes; // dependent on create return
        console.log(`Labour Created: ${labId}`);

        // 3. Advance Payment (Should be ignored in Cost)
        console.log('Recording Advance...');
        await Labour.recordPayment({
            labour_id: labId, project_id: projId, payment_date: '2023-01-01',
            payment_type: 'advance', base_amount: 500, net_amount: 500, deduction_amount: 0, payment_method: 'cash'
        });

        // 4. Time Payment (Wage 1000, Deduct 500 Advance, Net 500)
        console.log('Recording Salary...');
        await Labour.recordPayment({
            labour_id: labId, project_id: projId, payment_date: '2023-01-02',
            payment_type: 'weekly',
            base_amount: 1000,
            overtime_amount: 0, bonus_amount: 0,
            deduction_amount: 500, // Explicit deduction
            net_amount: 500,       // Actual Cash Out
            payment_method: 'cash'
        });

        // Settle the advance just in case logic depends on it (it shouldn't for cost, but for consistency)
        await Labour.settleAdvances(labId, projId, 500);

        // 5. Verify Labour Cost
        console.log('--- Checking Labour Cost ---');
        const cost = await Labour.getProjectLabourCost(projId);
        console.log('Labour Cost Result:', JSON.stringify(cost));

        // Expected: Gross 1000. (Ignoring Net 500).
        if (cost.total_gross_cost === 1000) {
            console.log('✅ SUCCESS: Labour Cost reflects Gross Wage (1000).');
        } else {
            console.log(`❌ FAIL: Labour Cost ${cost.total_gross_cost} != 1000`);
        }

        // 6. Setup Material Cost
        console.log('--- Setting up Material Cost ---');
        const mRes = await runQuery("INSERT INTO materials (name, unit, price, created_by) VALUES (?, 'nos', 50, 1)", [`TestMat-${rand}`]);
        const matId = mRes.id;

        // Stock OUT (Consumption)
        await runQuery("INSERT INTO inventory_transactions (project_id, material_id, type, quantity, date, created_by) VALUES (?, ?, 'OUT', 10, '2023-01-01', 1)", [projId, matId]);
        // Cost = 10 * 50 = 500.

        // 7. Verify Project Profit Report
        console.log('--- Checking Project Profit Report ---');
        const profits = await Reports.getProjectProfit();
        const myProj = profits.find(p => p.id === projId);

        if (myProj) {
            console.log(`Reported Labour Cost: ${myProj.labour_cost} (Exp: 1000)`);
            console.log(`Reported Material Cost: ${myProj.material_cost} (Exp: 500)`);
            console.log(`Reported Total Costs: ${myProj.total_costs} (Exp: 1500)`);

            if (myProj.total_costs === 1500 && myProj.labour_cost === 1000) {
                console.log('✅ SUCCESS: Project Profit Report Accurate.');
            } else {
                console.log('❌ FAIL: Totals mismatch.');
            }
        } else {
            console.log('❌ FAIL: Project not found in report.');
        }

    } catch (e) {
        console.error('❌ Script Error:', e);
    }
})();
