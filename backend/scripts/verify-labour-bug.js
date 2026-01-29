const Labour = require('../src/models/labour.model');
const { runQuery } = require('../src/config/db');
const { recordPayment } = require('../src/controllers/labour.controller'); // Testing controller logic

// Mock Req/Res
const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.data = data; return res; };
    return res;
};

async function runTest() {
    console.log('🧪 Starting Labour Logic Verification...');

    // 0. Setup
    const rand = Math.floor(Math.random() * 10000);
    const projId = (await runQuery("INSERT INTO projects (name, status, created_by) VALUES (?, 'ongoing', 1)", [`LabTest-${rand}`])).id;
    const labId = (await Labour.create({
        name: `Worker-${rand}`, type: 'Mason', gender: 'Male', phone: '123',
        address: 'X', employment_type: 'daily', skill_level: 'skilled', daily_wage: 500
    }));
    console.log(`✅ Setup: Proj ${projId}, Labour ${labId}`);

    // 1. Give Advance 500
    console.log('\n--- Step 1: Pay Advance 500 ---');
    const req1 = {
        body: {
            labour_id: labId, project_id: projId, payment_date: '2023-01-01',
            payment_type: 'advance', base_amount: 500, payment_method: 'cash'
        }
    };
    const res1 = mockRes();
    await recordPayment(req1, res1);
    if (res1.statusCode !== 201) console.log('❌ Advance Failed', res1.data);
    else console.log('✅ Advance Recorded');

    // 2. Pay Salary 1 (Gross 1000, should deduct 500)
    console.log('\n--- Step 2: Pay Salary 1 (Gross 1000) ---');
    const req2 = {
        body: {
            labour_id: labId, project_id: projId, payment_date: '2023-01-07',
            payment_type: 'weekly', base_amount: 1000, payment_method: 'cash', stage_id: null
        }
    };
    const res2 = mockRes();
    await recordPayment(req2, res2);

    // Check results
    if (res2.data.data.net_amount === 500) {
        console.log('✅ Salary 1 Correct: 1000 - 500 = 500');
    } else {
        console.log(`❌ Salary 1 Wrong: Net ${res2.data.data.net_amount}`);
    }

    // 3. Pay Salary 2 (Gross 1000, should deduct 0 - Advance already recovered)
    console.log('\n--- Step 3: Pay Salary 2 (Gross 1000) ---');
    const req3 = {
        body: {
            labour_id: labId, project_id: projId, payment_date: '2023-01-14',
            payment_type: 'weekly', base_amount: 1000, payment_method: 'cash', stage_id: null
        }
    };
    const res3 = mockRes();
    await recordPayment(req3, res3);

    // Check results
    if (res3.data.data.net_amount === 1000) {
        console.log('✅ Salary 2 Correct: 1000 - 0 = 1000');
    } else {
        console.log(`❌ Salary 2 FAILS: Net ${res3.data.data.net_amount} (Expected 1000)`);
        console.log('⚠️ RISK: DOUBLE DEDUCTION CONFIRMED');
    }
}

async function runWrapped() {
    try {
        await runTest();
    } catch (e) {
        console.error('❌ CRITICAL FAILURE:', e);
    }
}

runWrapped();
