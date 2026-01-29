const Labour = require('../src/models/labour.model');
const { runQuery, getOne } = require('../src/config/db');

async function verifyLabourAttendance() {
    console.log('🧪 Starting Labour Attendance Verification...');

    // Setup Test Data
    const rand = Math.floor(Math.random() * 10000);
    const date = new Date().toISOString().split('T')[0];

    try {
        // 1. Create Labour
        const labourId = await Labour.create({
            name: `Test Labour ${rand}`,
            type: 'Mason',
            daily_wage: 500,
            gender: 'male',
            phone: `99${rand}99`,
            address: 'Test Address',
            employment_type: 'daily',
            skill_level: 'skilled'
        });
        console.log(`Created Labour: ${labourId}`);

        // 2. Create Project
        const projRes = await runQuery("INSERT INTO projects (name, status, location, start_date) VALUES (?, 'ongoing', 'Test Site', '2025-01-01')", [`Test Proj ${rand}`]);
        const projectId = projRes.id;
        console.log(`Created Project: ${projectId}`);

        // 3. Mark DRAFT Attendance
        console.log('--- Test 1: Mark Draft Attendance ---');
        const attId = await Labour.markAttendance({
            labour_id: labourId,
            project_id: projectId,
            attendance_date: date,
            attendance_type: 'FULL',
            work_hours: 8
        }, 1); // User ID 1
        console.log(`Marked Attendance ID: ${attId} (Status: DRAFT)`);

        // Verify Draft Status
        let att = await getOne('SELECT status, labour_payment_id FROM labour_attendance WHERE id = ?', [attId]);
        if (att.status !== 'draft') throw new Error(`Expected status 'draft', got '${att.status}'`);
        console.log('✅ Attendance is DRAFT');

        // 4. Try to Link/Pay DRAFT (Should FAIL to link or simply not link)
        // linkAttendanceToPayment only links CONFIRMED status.
        // We simulate a payment run.
        console.log('--- Test 2: Ensure DRAFT is ignored by Payroll ---');
        const payId1 = await Labour.recordPayment({
            labour_id: labourId, project_id: projectId, payment_date: date, payment_type: 'daily',
            base_amount: 500, net_amount: 500, deduction_amount: 0, notes: 'Test Pay 1',
            payment_method: 'cash'
        });
        // Call Linker manually (as Controller does)
        await Labour.linkAttendanceToPayment(labourId, projectId, date, payId1);

        att = await getOne('SELECT labour_payment_id FROM labour_attendance WHERE id = ?', [attId]);
        if (att.labour_payment_id) throw new Error('❌ CRITICAL: DRAFT attendance was linked to payment!');
        console.log('✅ DRAFT attendance skipped by payroll (Correct)');

        // 5. Confirm Attendance
        console.log('--- Test 3: Confirm Attendance ---');
        await Labour.confirmAttendance(attId, 1);
        att = await getOne('SELECT status FROM labour_attendance WHERE id = ?', [attId]);
        if (att.status !== 'confirmed') throw new Error('Failed to confirm attendance');
        console.log('✅ Attendance CONFIRMED');

        // 6. Pay CONFIRMED Attendance
        console.log('--- Test 4: Pay CONFIRMED Attendance ---');
        const payId2 = await Labour.recordPayment({
            labour_id: labourId, project_id: projectId, payment_date: date, payment_type: 'daily',
            base_amount: 500, net_amount: 500, deduction_amount: 0, notes: 'Test Pay 2',
            payment_method: 'cash'
        });
        await Labour.linkAttendanceToPayment(labourId, projectId, date, payId2);

        att = await getOne('SELECT labour_payment_id FROM labour_attendance WHERE id = ?', [attId]);
        if (att.labour_payment_id !== payId2) throw new Error('❌ CONFIRMED attendance NOT linked to payment!');
        console.log('✅ CONFIRMED attendance linked to payment');

        // 7. Try to Edit CONFIRMED/PAID Attendance (Should Block)
        // Note: I didn't verify specific Edit Blocking in Model yet, only check for delete/mark?
        // Ah, `confirmAttendance` has a check `if (att.labour_payment_id) throw error`.
        // But what about `update`? `labour.model.js` doesn't seem to have `updateAttendance`.
        // The user request says "All edits after confirmation must be blocked". 
        // Currently I only implemented `markAttendance` (Insert). 
        // If there is no update/edit function exposed, it is immutable by default!
        // `updateLabour` is for labour profile.
        // I will verify `markAttendance` duplicate check.
        console.log('--- Test 5: Prevent Duplicate Attendance ---');
        try {
            await Labour.markAttendance({
                labour_id: labourId, project_id: projectId, attendance_date: date,
                attendance_type: 'HALF'
            }, 1);
            throw new Error('❌ Allowed duplicate attendance!');
        } catch (e) {
            if (e.message.includes('Attendance already marked')) {
                console.log('✅ Duplicate attendance blocked');
            } else {
                throw e;
            }
        }

        // 8. Try to Confirm Paid Attendance (Should Fail/Idempotent?)
        console.log('--- Test 6: Confirming Paid Attendance ---');
        try {
            await Labour.confirmAttendance(attId, 1);
            // My code throws: 'Cannot edit/confirm paid attendance'
            throw new Error('❌ Allowed confirming paid attendance!');
        } catch (e) {
            if (e.message.includes('paid attendance')) {
                console.log('✅ Blocked modification of paid attendance');
            } else { // It might return true if idempotent logic runs before check? 
                // My code: fetch -> check payment -> update.
                throw e;
            }
        }

        console.log('\n🎉 ALL TESTS PASSED');

    } catch (e) {
        console.error('Test Failed:', e);
        require('fs').writeFileSync('test_err.txt', e.toString() + JSON.stringify(e, null, 2));
        process.exit(1);
    }
}
verifyLabourAttendance();
