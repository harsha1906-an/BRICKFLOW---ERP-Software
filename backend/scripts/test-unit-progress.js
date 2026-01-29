const UnitProgress = require('../src/models/unitProgress.model');
const ConstructionStage = require('../src/models/constructionStage.model');
const { getOne, runQuery } = require('../src/config/db');
const fs = require('fs');

const TEST_LOG = [];

function log(test, status, message, details = null) {
    const entry = { test, status, message, timestamp: new Date().toISOString() };
    if (details) entry.details = details;
    TEST_LOG.push(entry);
    console.log(`[${status}] ${test}: ${message}`);
    if (details) console.log(`   ${JSON.stringify(details)}`);
}

async function runTests() {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   UNIT PROGRESS - REGRESSION TESTS          ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    let testUnitId;
    let testUserId;
    let foundationStageId;

    try {
        // Setup: Create test unit
        console.log('=== SETUP ===\n');

        const project = await getOne('SELECT id FROM projects LIMIT 1');
        if (!project) {
            throw new Error('No projects found - create a test project first');
        }

        await runQuery(`
            INSERT INTO units (unit_number, project_id, status, type)
            VALUES ('TEST-UNIT-001', ?, 'available', '2BHK')
        `, [project.id]);

        testUnitId = (await getOne('SELECT id FROM units WHERE unit_number = ?', ['TEST-UNIT-001'])).id;
        log('SETUP', 'INFO', `Created test unit ID: ${testUnitId}`);

        testUserId = (await getOne('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin'])).id;
        log('SETUP', 'INFO', `Using admin user ID: ${testUserId}`);

        foundationStageId = (await getOne('SELECT id FROM construction_stages WHERE name = ?', ['Foundation'])).id;
        log('SETUP', 'INFO', `Foundation stage ID: ${foundationStageId}`);

        // Test 1: Initialize unit progress
        console.log('\n=== TEST 1: Initialize Unit Progress ===\n');

        await UnitProgress.initializeUnitProgress(testUnitId);
        const progress = await UnitProgress.getUnitProgress(testUnitId);

        if (progress.stages.length === 11) {
            log('TEST 1', 'PASS', 'All 11 stages initialized');
        } else {
            log('TEST 1', 'FAIL', `Expected 11 stages, got ${progress.stages.length}`);
        }

        const allNotStarted = progress.stages.every(s => s.status === 'NOT_STARTED');
        if (allNotStarted) {
            log('TEST 1', 'PASS', 'All stages default to NOT_STARTED');
        } else {
            log('TEST 1', 'FAIL', 'Some stages not in NOT_STARTED status');
        }

        // Test 2: Mark IN_PROGRESS
        console.log('\n=== TEST 2: Mark Stage IN_PROGRESS ===\n');

        await UnitProgress.updateStatus(testUnitId, foundationStageId, 'IN_PROGRESS', testUserId);
        const afterInProgress = await UnitProgress.getUnitProgress(testUnitId);
        const foundationProgress = afterInProgress.stages.find(s => s.stage_id === foundationStageId);

        if (foundationProgress.status === 'IN_PROGRESS') {
            log('TEST 2', 'PASS', 'Stage marked as IN_PROGRESS');
        } else {
            log('TEST 2', 'FAIL', `Expected IN_PROGRESS, got ${foundationProgress.status}`);
        }

        if (foundationProgress.started_on) {
            log('TEST 2', 'PASS', 'started_on date populated');
        } else {
            log('TEST 2', 'FAIL', 'started_on not populated');
        }

        // Test 3: Mark COMPLETED
        console.log('\n=== TEST 3: Mark Stage COMPLETED ===\n');

        await UnitProgress.updateStatus(testUnitId, foundationStageId, 'COMPLETED', testUserId, 'Test completion');
        const afterCompleted = await UnitProgress.getUnitProgress(testUnitId);
        const completedStage = afterCompleted.stages.find(s => s.stage_id === foundationStageId);

        if (completedStage.status === 'COMPLETED') {
            log('TEST 3', 'PASS', 'Stage marked as COMPLETED');
        } else {
            log('TEST 3', 'FAIL', `Expected COMPLETED, got ${completedStage.status}`);
        }

        if (completedStage.completed_on) {
            log('TEST 3', 'PASS', 'completed_on date populated');
        } else {
            log('TEST 3', 'FAIL', 'completed_on not populated');
        }

        if (completedStage.verified_by === testUserId) {
            log('TEST 3', 'PASS', 'verified_by set correctly');
        } else {
            log('TEST 3', 'FAIL', `verified_by mismatch: expected ${testUserId}, got ${completedStage.verified_by}`);
        }

        // Test 4: Block editing completed stage (IMMUTABILITY)
        console.log('\n=== TEST 4: Immutability Test ===\n');

        try {
            await UnitProgress.updateStatus(testUnitId, foundationStageId, 'IN_PROGRESS', testUserId);
            log('TEST 4', 'FAIL', 'Should have blocked editing completed stage');
        } catch (error) {
            if (error.message.includes('immutable')) {
                log('TEST 4', 'PASS', 'Completed stage is immutable');
            } else {
                log('TEST 4', 'FAIL', `Wrong error: ${error.message}`);
            }
        }

        // Test 5: Duplicate unit+stage blocked
        console.log('\n=== TEST 5: UNIQUE Constraint Test ===\n');

        try {
            await runQuery(`
                INSERT INTO unit_progress (unit_id, stage_id, status)
                VALUES (?, ?, 'NOT_STARTED')
            `, [testUnitId, foundationStageId]);
            log('TEST 5', 'FAIL', 'Should have blocked duplicate unit+stage');
        } catch (error) {
            if (error.message.includes('UNIQUE')) {
                log('TEST 5', 'PASS', 'UNIQUE constraint enforced');
            } else {
                log('TEST 5', 'FAIL', `Wrong error: ${error.message}`);
            }
        }

        // Test 6: Analytics accuracy
        console.log('\n=== TEST 6: Analytics Accuracy ===\n');

        const finalProgress = await UnitProgress.getUnitProgress(testUnitId);

        if (finalProgress.overall_percentage === 10) {
            log('TEST 6', 'PASS', 'Progress percentage correct (Foundation = 10%)');
        } else {
            log('TEST 6', 'FAIL', `Expected 10%, got ${finalProgress.overall_percentage}%`);
        }

        if (finalProgress.completed_stages === 1) {
            log('TEST 6', 'PASS', 'Completed stage count correct');
        } else {
            log('TEST 6', 'FAIL', `Expected 1 completed, got ${finalProgress.completed_stages}`);
        }

        // Test 7: Invalid status transition
        console.log('\n=== TEST 7: Invalid Transition Test ===\n');

        const plinthStageId = (await getOne('SELECT id FROM construction_stages WHERE name = ?', ['Plinth'])).id;

        try {
            await UnitProgress.updateStatus(testUnitId, plinthStageId, 'COMPLETED', testUserId);
            log('TEST 7', 'FAIL', 'Should have blocked NOT_STARTED → COMPLETED');
        } catch (error) {
            if (error.message.includes('Invalid status transition')) {
                log('TEST 7', 'PASS', 'Invalid transition blocked');
            } else {
                log('TEST 7', 'FAIL', `Wrong error: ${error.message}`);
            }
        }

        // Test 8: Project-level progress
        console.log('\n=== TEST 8: Project Progress Aggregation ===\n');

        const projectProgress = await UnitProgress.getProjectProgress(project.id);

        if (projectProgress.units.length > 0) {
            log('TEST 8', 'PASS', 'Project progress aggregated');
        } else {
            log('TEST 8', 'FAIL', 'No units found in project progress');
        }

        // Cleanup
        console.log('\n=== CLEANUP ===\n');
        await runQuery('DELETE FROM unit_progress WHERE unit_id = ?', [testUnitId]);
        await runQuery('DELETE FROM units WHERE id = ?', [testUnitId]);
        log('CLEANUP', 'INFO', 'Test data removed');

        // Summary
        console.log('\n=== TEST SUMMARY ===\n');
        const passCount = TEST_LOG.filter(l => l.status === 'PASS').length;
        const failCount = TEST_LOG.filter(l => l.status === 'FAIL').length;

        console.log(`Total Tests: ${passCount + failCount}`);
        console.log(`✅ Passed: ${passCount}`);
        console.log(`❌ Failed: ${failCount}`);

        fs.writeFileSync('unit_progress_test.json', JSON.stringify(TEST_LOG, null, 2));
        console.log('\nDetailed log: unit_progress_test.json');

        if (failCount === 0) {
            console.log('\n🎉 ALL TESTS PASSED!\n');
        } else {
            console.log('\n⚠️  Some tests failed. Review logs.\n');
            process.exit(1);
        }

    } catch (error) {
        console.error('Test suite failed:', error);
        fs.writeFileSync('unit_progress_test_error.txt', error.toString());
        process.exit(1);
    }
}

runTests();
