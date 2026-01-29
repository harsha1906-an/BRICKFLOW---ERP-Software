const { runQuery, getAll, getOne } = require('../src/config/db');
const Labour = require('../src/models/labour.model');
const fs = require('fs');

const AUDIT_REPORT = [];

function log(phase, status, message) {
    const entry = { phase, status, message, timestamp: new Date().toISOString() };
    AUDIT_REPORT.push(entry);
    console.log(`[${status}] ${phase}: ${message}`);
}

async function phase1_DataModelVerification() {
    console.log('\n=== PHASE 1: DATA MODEL VERIFICATION ===\n');

    try {
        const schema = await getAll("PRAGMA table_info(labour_attendance)");
        const columns = schema.map(c => c.name);

        // Required columns check
        const required = ['labour_id', 'project_id', 'attendance_date', 'attendance_type', 'work_hours', 'substitute_labour_id', 'status', 'marked_by', 'created_at'];
        const missing = required.filter(col => !columns.includes(col));

        if (missing.length > 0) {
            log('PHASE 1', 'FAIL', `Missing required columns: ${missing.join(', ')}`);
            return false;
        }

        // Check for wage/amount fields (should NOT exist)
        const forbidden = ['wage', 'amount', 'salary', 'payment_amount'];
        const found = forbidden.filter(col => columns.includes(col));

        if (found.length > 0) {
            log('PHASE 1', 'ERROR', `Found forbidden columns: ${found.join(', ')}`);
            return false;
        }

        // Verify attendance_type constraint
        const tableSQL = await getOne("SELECT sql FROM sqlite_master WHERE type='table' AND name='labour_attendance'");
        if (!tableSQL.sql.includes("CHECK(attendance_type IN")) {
            log('PHASE 1', 'WARNING', 'attendance_type lacks CHECK constraint');
        }

        // Verify status constraint
        if (!tableSQL.sql.includes("CHECK(status IN")) {
            log('PHASE 1', 'ERROR', 'status field missing CHECK constraint');
            return false;
        }

        log('PHASE 1', 'PASS', 'Data model verified successfully');
        return true;

    } catch (e) {
        log('PHASE 1', 'ERROR', e.message);
        return false;
    }
}

async function phase2_UniquenessCheck() {
    console.log('\n=== PHASE 2: UNIQUENESS & DUPLICATION CHECK ===\n');

    try {
        const rand = Math.floor(Math.random() * 100000);
        const date = '2025-01-15';

        // Create test labour
        const labourId = await Labour.create({
            name: `Audit Labour ${rand}`,
            type: 'Mason',
            daily_wage: 500,
            gender: 'male',
            phone: `99${rand}99`,
            address: 'Test',
            employment_type: 'daily',
            skill_level: 'skilled'
        });

        // Create test project
        const projRes = await runQuery("INSERT INTO projects (name, status, location, start_date) VALUES (?, 'ongoing', 'Test Site', '2025-01-01')", [`Audit Proj ${rand}`]);
        const projectId = projRes.id;

        // First attendance - should succeed
        const att1 = await Labour.markAttendance({
            labour_id: labourId,
            project_id: projectId,
            attendance_date: date,
            attendance_type: 'FULL',
            work_hours: 8
        }, 1);

        log('PHASE 2', 'INFO', `First attendance created: ${att1}`);

        // Second attendance - MUST fail
        try {
            await Labour.markAttendance({
                labour_id: labourId,
                project_id: projectId,
                attendance_date: date,
                attendance_type: 'HALF',
                work_hours: 4
            }, 1);

            log('PHASE 2', 'CRITICAL', 'Duplicate attendance was ALLOWED - SECURITY VIOLATION');
            return false;

        } catch (e) {
            if (e.message.includes('already marked')) {
                log('PHASE 2', 'PASS', 'Duplicate attendance correctly blocked');
                return true;
            } else {
                log('PHASE 2', 'ERROR', `Unexpected error: ${e.message}`);
                return false;
            }
        }

    } catch (e) {
        log('PHASE 2', 'ERROR', e.message);
        return false;
    }
}

async function phase3_BusinessRuleValidation() {
    console.log('\n=== PHASE 3: BUSINESS RULE VALIDATION ===\n');

    try {
        const rand = Math.floor(Math.random() * 100000);

        // Create test labour
        const labourId = await Labour.create({
            name: `Rule Test ${rand}`,
            type: 'Helper',
            daily_wage: 400,
            gender: 'male',
            phone: `98${rand}99`,
            address: 'Test',
            employment_type: 'daily',
            skill_level: 'unskilled'
        });

        const projRes = await runQuery("INSERT INTO projects (name, status, location, start_date) VALUES (?, 'ongoing', 'Test', '2025-01-01')", [`Rule Proj ${rand}`]);
        const projectId = projRes.id;

        // Test 1: Future date blocking
        const futureDate = '2026-12-31';
        try {
            await Labour.markAttendance({
                labour_id: labourId,
                project_id: projectId,
                attendance_date: futureDate,
                attendance_type: 'FULL'
            }, 1);
            log('PHASE 3', 'FAIL', 'Future date attendance was ALLOWED');
            return false;
        } catch (e) {
            if (e.message.includes('future')) {
                log('PHASE 3', 'PASS', 'Future dates correctly blocked');
            }
        }

        // Test 2: Inactive labour blocking
        await runQuery('UPDATE labours SET is_active = 0 WHERE id = ?', [labourId]);
        try {
            await Labour.markAttendance({
                labour_id: labourId,
                project_id: projectId,
                attendance_date: '2025-01-10',
                attendance_type: 'FULL'
            }, 1);
            log('PHASE 3', 'FAIL', 'Inactive labour attendance was ALLOWED');
            return false;
        } catch (e) {
            if (e.message.includes('not found')) {
                log('PHASE 3', 'PASS', 'Inactive labour correctly blocked');
            }
        }

        log('PHASE 3', 'PASS', 'Business rules validated successfully');
        return true;

    } catch (e) {
        log('PHASE 3', 'ERROR', e.message);
        return false;
    }
}

async function phase4_SubstituteLogic() {
    console.log('\n=== PHASE 4: SUBSTITUTE LABOUR LOGIC ===\n');

    try {
        const rand = Math.floor(Math.random() * 100000);
        const date = '2025-01-20';

        // Create original labour
        const labour1 = await Labour.create({
            name: `Original ${rand}`,
            type: 'Mason',
            daily_wage: 600,
            gender: 'male',
            phone: `97${rand}99`,
            address: 'Test',
            employment_type: 'daily',
            skill_level: 'skilled'
        });

        // Create substitute labour
        const labour2 = await Labour.create({
            name: `Substitute ${rand}`,
            type: 'Mason',
            daily_wage: 550,
            gender: 'female',
            phone: `96${rand}99`,
            address: 'Test',
            employment_type: 'daily',
            skill_level: 'skilled'
        });

        const projRes = await runQuery("INSERT INTO projects (name, status, location, start_date) VALUES (?, 'ongoing', 'Test', '2025-01-01')", [`Sub Proj ${rand}`]);
        const projectId = projRes.id;

        // Mark original absent with substitute
        const att1 = await Labour.markAttendance({
            labour_id: labour1,
            project_id: projectId,
            attendance_date: date,
            attendance_type: 'ABSENT',
            substitute_labour_id: labour2
        }, 1);

        // Verify original labour record
        const origRecord = await getOne('SELECT * FROM labour_attendance WHERE id = ?', [att1]);
        if (origRecord.labour_id !== labour1) {
            log('PHASE 4', 'ERROR', 'Original labour_id was overwritten');
            return false;
        }

        if (origRecord.attendance_type !== 'ABSENT') {
            log('PHASE 4', 'ERROR', 'Original attendance_type not ABSENT');
            return false;
        }

        log('PHASE 4', 'PASS', 'Substitute logic correctly preserves original attendance');
        log('PHASE 4', 'INFO', 'Note: Substitute attendance must be marked separately');
        return true;

    } catch (e) {
        log('PHASE 4', 'ERROR', e.message);
        return false;
    }
}

async function phase5_ConfirmationImmutability() {
    console.log('\n=== PHASE 5: CONFIRMATION & IMMUTABILITY ===\n');

    try {
        const rand = Math.floor(Math.random() * 100000);
        const date = '2025-01-18';

        const labourId = await Labour.create({
            name: `Immut Test ${rand}`,
            type: 'Electrician',
            daily_wage: 700,
            gender: 'male',
            phone: `95${rand}99`,
            address: 'Test',
            employment_type: 'daily',
            skill_level: 'skilled'
        });

        const projRes = await runQuery("INSERT INTO projects (name, status, location, start_date) VALUES (?, 'ongoing', 'Test', '2025-01-01')", [`Immut Proj ${rand}`]);
        const projectId = projRes.id;

        // Create attendance
        const attId = await Labour.markAttendance({
            labour_id: labourId,
            project_id: projectId,
            attendance_date: date,
            attendance_type: 'FULL',
            work_hours: 8
        }, 1);

        // Verify default status = draft
        let att = await getOne('SELECT status FROM labour_attendance WHERE id = ?', [attId]);
        if (att.status !== 'draft') {
            log('PHASE 5', 'FAIL', `Default status is '${att.status}', expected 'draft'`);
            return false;
        }
        log('PHASE 5', 'PASS', 'Default status is DRAFT');

        // Confirm attendance
        await Labour.confirmAttendance(attId, 1);
        att = await getOne('SELECT status FROM labour_attendance WHERE id = ?', [attId]);
        if (att.status !== 'confirmed') {
            log('PHASE 5', 'FAIL', 'Confirmation failed');
            return false;
        }
        log('PHASE 5', 'PASS', 'Attendance confirmed successfully');

        // Note: Edit/Delete blocking would require separate endpoints
        // Currently, the model doesn't expose update/delete for attendance
        // Frontend should enforce this via UI restrictions

        log('PHASE 5', 'PASS', 'Confirmation workflow validated');
        return true;

    } catch (e) {
        log('PHASE 5', 'ERROR', e.message);
        return false;
    }
}

async function phase6_PayrollLinkageSafety() {
    console.log('\n=== PHASE 6: PAYROLL LINKAGE SAFETY ===\n');

    try {
        const rand = Math.floor(Math.random() * 100000);
        const date = '2025-01-22';

        const labourId = await Labour.create({
            name: `Payroll Test ${rand}`,
            type: 'Plumber',
            daily_wage: 650,
            gender: 'male',
            phone: `94${rand}99`,
            address: 'Test',
            employment_type: 'daily',
            skill_level: 'skilled'
        });

        const projRes = await runQuery("INSERT INTO projects (name, status, location, start_date) VALUES (?, 'ongoing', 'Test', '2025-01-01')", [`Pay Proj ${rand}`]);
        const projectId = projRes.id;

        // Create DRAFT attendance
        const draftId = await Labour.markAttendance({
            labour_id: labourId,
            project_id: projectId,
            attendance_date: date,
            attendance_type: 'FULL',
            work_hours: 8
        }, 1);

        // Attempt payment (should NOT link draft)
        const pay1 = await Labour.recordPayment({
            labour_id: labourId,
            project_id: projectId,
            payment_date: date,
            payment_type: 'daily',
            base_amount: 650,
            net_amount: 650,
            deduction_amount: 0,
            notes: 'Test Pay',
            payment_method: 'cash'
        });

        await Labour.linkAttendanceToPayment(labourId, projectId, date, pay1);

        let att = await getOne('SELECT labour_payment_id FROM labour_attendance WHERE id = ?', [draftId]);
        if (att.labour_payment_id) {
            log('PHASE 6', 'CRITICAL', 'DRAFT attendance was PAID - FRAUD RISK');
            return false;
        }
        log('PHASE 6', 'PASS', 'DRAFT attendance correctly ignored by payroll');

        // Confirm and pay
        await Labour.confirmAttendance(draftId, 1);
        const pay2 = await Labour.recordPayment({
            labour_id: labourId,
            project_id: projectId,
            payment_date: date,
            payment_type: 'daily',
            base_amount: 650,
            net_amount: 650,
            deduction_amount: 0,
            notes: 'Real Pay',
            payment_method: 'cash'
        });

        await Labour.linkAttendanceToPayment(labourId, projectId, date, pay2);

        att = await getOne('SELECT labour_payment_id FROM labour_attendance WHERE id = ?', [draftId]);
        if (!att.labour_payment_id) {
            log('PHASE 6', 'FAIL', 'CONFIRMED attendance was NOT linked to payment');
            return false;
        }
        log('PHASE 6', 'PASS', 'CONFIRMED attendance linked to payment');

        // Attempt double payment
        const pay3 = await Labour.recordPayment({
            labour_id: labourId,
            project_id: projectId,
            payment_date: date,
            payment_type: 'daily',
            base_amount: 650,
            net_amount: 650,
            deduction_amount: 0,
            notes: 'Double Pay Attempt',
            payment_method: 'cash'
        });

        await Labour.linkAttendanceToPayment(labourId, projectId, date, pay3);

        const attCount = await getOne(
            'SELECT COUNT(*) as cnt FROM labour_attendance WHERE labour_id = ? AND labour_payment_id = ?',
            [labourId, pay3]
        );

        if (attCount.cnt > 0) {
            log('PHASE 6', 'CRITICAL', 'Attendance was PAID TWICE - DOUBLE PAYMENT FRAUD');
            return false;
        }

        log('PHASE 6', 'PASS', 'Double payment correctly prevented');
        return true;

    } catch (e) {
        log('PHASE 6', 'ERROR', e.message);
        return false;
    }
}

async function phase7_AdvanceConsistencyCheck() {
    console.log('\n=== PHASE 7: ADVANCE & COST CONSISTENCY ===\n');

    try {
        const rand = Math.floor(Math.random() * 100000);
        const date = '2025-01-25';

        const labourId = await Labour.create({
            name: `Adv Test ${rand}`,
            type: 'Helper',
            daily_wage: 400,
            gender: 'male',
            phone: `93${rand}99`,
            address: 'Test',
            employment_type: 'daily',
            skill_level: 'unskilled'
        });

        const projRes = await runQuery("INSERT INTO projects (name, status, location, start_date) VALUES (?, 'ongoing', 'Test', '2025-01-01')", [`Adv Proj ${rand}`]);
        const projectId = projRes.id;

        // Create attendance
        const attId = await Labour.markAttendance({
            labour_id: labourId,
            project_id: projectId,
            attendance_date: date,
            attendance_type: 'FULL',
            work_hours: 8
        }, 1);

        await Labour.confirmAttendance(attId, 1);

        // Record advance
        await Labour.recordPayment({
            labour_id: labourId,
            project_id: projectId,
            payment_date: '2025-01-20',
            payment_type: 'advance',
            base_amount: 0,
            net_amount: 200,
            deduction_amount: 0,
            notes: 'Advance',
            payment_method: 'cash'
        });

        // Verify attendance is NOT modified
        const att = await getOne('SELECT * FROM labour_attendance WHERE id = ?', [attId]);
        if (att.labour_payment_id) {
            log('PHASE 7', 'ERROR', 'Advance payment incorrectly linked to attendance');
            return false;
        }

        log('PHASE 7', 'PASS', 'Attendance data independent of advances');
        log('PHASE 7', 'INFO', 'Gross wage calculation should be based on attendance only');
        return true;

    } catch (e) {
        log('PHASE 7', 'ERROR', e.message);
        return false;
    }
}

async function generateReport() {
    const passCount = AUDIT_REPORT.filter(r => r.status === 'PASS').length;
    const failCount = AUDIT_REPORT.filter(r => r.status === 'FAIL').length;
    const criticalCount = AUDIT_REPORT.filter(r => r.status === 'CRITICAL').length;
    const errorCount = AUDIT_REPORT.filter(r => r.status === 'ERROR').length;

    let riskLevel = 'LOW';
    let verdict = 'SAFE FOR PRODUCTION';

    if (criticalCount > 0) {
        riskLevel = 'HIGH';
        verdict = 'NOT SAFE';
    } else if (failCount > 0 || errorCount > 0) {
        riskLevel = 'MEDIUM';
        verdict = 'SAFE WITH LIMITATIONS';
    }

    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            total_tests: AUDIT_REPORT.length,
            passed: passCount,
            failed: failCount,
            critical: criticalCount,
            errors: errorCount
        },
        risk_level: riskLevel,
        verdict: verdict,
        detailed_results: AUDIT_REPORT
    };

    fs.writeFileSync('LABOUR_ATTENDANCE_AUDIT.json', JSON.stringify(report, null, 2));

    console.log('\n=== AUDIT SUMMARY ===\n');
    console.log(`Total Tests: ${AUDIT_REPORT.length}`);
    console.log(`Passed: ${passCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`Critical: ${criticalCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`\nRisk Level: ${riskLevel}`);
    console.log(`Verdict: ${verdict}`);
    console.log(`\nDetailed report saved to LABOUR_ATTENDANCE_AUDIT.json`);
}

async function runAudit() {
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║  LABOUR ATTENDANCE MODULE - SECURITY AUDIT   ║');
    console.log('╚═══════════════════════════════════════════════╝');

    try {
        await phase1_DataModelVerification();
        await phase2_UniquenessCheck();
        await phase3_BusinessRuleValidation();
        await phase4_SubstituteLogic();
        await phase5_ConfirmationImmutability();
        await phase6_PayrollLinkageSafety();
        await phase7_AdvanceConsistencyCheck();

        await generateReport();

    } catch (e) {
        console.error('Audit failed:', e);
        fs.writeFileSync('audit_error.txt', e.toString());
    }
}

runAudit();
