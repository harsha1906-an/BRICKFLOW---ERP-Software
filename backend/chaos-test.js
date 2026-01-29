const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/api';
const LOG_FILE = 'chaos-report.log';

// Utility to log results
const log = (msg) => {
    const timestamp = new Date().toISOString();
    const logMsg = `[${timestamp}] ${msg}`;
    console.log(logMsg);
    fs.appendFileSync(LOG_FILE, logMsg + '\n');
};

async function runChaosTests() {
    log('💀 STARTING CHAOS TESTING SUITE 💀');
    log('-----------------------------------');

    let adminToken = '';
    let adminUser = {};

    // 1. AUTHENTICATION ATTACKS
    log('\n🔐 TEST PHASE 1: AUTHENTICATION ATTACKS');

    // 1.1 SQL Injection in Login
    try {
        log('   Testing SQL Injection in Login...');
        await axios.post(`${BASE_URL}/auth/login`, {
            username: "' OR 1=1 --",
            password: "password"
        });
        log('   ❌ FAIL: SQL Injection payload accepted (or 200 OK returned)');
    } catch (e) {
        if (e.response && (e.response.status === 401 || e.response.status === 400 || e.response.status === 429)) {
            log(`   ✅ PASS: SQL Injection blocked (Status: ${e.response.status})`);
        } else {
            log(`   ⚠️ UNKNOWN: ${e.message}`);
        }
    }

    // 1.2 Brute Force / Rate Limiting
    log('   Testing Rate Limiting (Brute Force)...');
    try {
        const promises = [];
        for (let i = 0; i < 10; i++) {
            promises.push(axios.post(`${BASE_URL}/auth/login`, {
                username: "admin",
                password: `wrongpass${i}`
            }));
        }
        await Promise.allSettled(promises);
        log('   ℹ️  10 requests sent. Checking if next request is blocked...');

        try {
            await axios.post(`${BASE_URL}/auth/login`, { username: "admin", password: "wrongpass_final" });
            log('   ❌ FAIL: Rate limiter did not block subsequent request');
        } catch (e) {
            if (e.response && e.response.status === 429) {
                log('   ✅ PASS: Rate limiter active (429 Too Many Requests)');
            } else {
                log(`   ⚠️ INFO: Status ${e.response ? e.response.status : e.message}`);
            }
        }
    } catch (e) { }

    // Get legitimate token for further tests
    try {
        const res = await axios.post(`${BASE_URL}/auth/login`, {
            username: "admin",
            password: "admin123"
        });
        adminToken = res.data.token;
        adminUser = res.data.user;
        log('   ℹ️  Acquired Admin Token for authenticated tests');
    } catch (e) {
        log('   ⚠️ SKIPPING Authenticated tests: Could not login as admin');
        return;
    }

    const authHeaders = { Authorization: `Bearer ${adminToken}` };

    // 2. INPUT VALIDATION & LOGIC BOMBS
    log('\n💣 TEST PHASE 2: DATA VALIDATION & LOGIC BOMBS');

    // 2.1 Negative Payments
    log('   Testing Negative Payment Amount...');
    try {
        await axios.post(`${BASE_URL}/payments`, {
            booking_id: 1,
            amount: -5000,
            payment_date: '2024-01-01',
            payment_method: 'cash'
        }, { headers: authHeaders });
        log('   ❌ FAIL: Negative payment accepted');
    } catch (e) {
        if (e.response && e.response.status === 400) {
            log('   ✅ PASS: Negative payment rejected (400 Bad Request)');
        } else {
            log(`   ❌ FAIL: Unexpected status ${e.response ? e.response.status : e.message}`);
        }
    }

    // 2.2 Massive Overflow Numbers
    log('   Testing Number Overflow...');
    try {
        await axios.post(`${BASE_URL}/payments`, {
            booking_id: 1,
            amount: 9999999999999999999999999, // Exceeds typical SQL limits or JS safe integer
            payment_date: '2024-01-01',
            payment_method: 'cash'
        }, { headers: authHeaders });
        log('   ⚠️ WARNING: Overflow payment accepted (Check DB for stored value)');
    } catch (e) {
        log(`   ℹ️  Response: ${e.response ? e.response.status : e.message}`);
    }

    // 2.3 XSS Payload in Text Fields
    log('   Testing Stored XSS in Project Name...');
    try {
        await axios.post(`${BASE_URL}/projects`, {
            name: "<script>alert('XSS')</script>",
            location: "Test Loc",
            start_date: "2024-01-01",
            status: "planning"
        }, { headers: authHeaders });
        log('   ⚠️ WARNING: XSS payload accepted (Ensure frontend escapes output!)');
    } catch (e) {
        log(`   ℹ️  Response: ${e.response ? e.response.status : e.message}`);
    }

    // 3. CONCURRENCY / RACE CONDITIONS
    log('\n🏎️ TEST PHASE 3: RACE CONDITIONS');
    log('   Testing Double-Spend (Concurrent Payments)...');

    // Create a dummy booking first to pay against? Or use ID 1
    const bookingId = 1;

    try {
        const payRequest = () => axios.post(`${BASE_URL}/payments`, {
            booking_id: bookingId,
            amount: 100,
            payment_date: '2024-01-01',
            payment_method: 'cash',
            notes: 'Race Test'
        }, { headers: authHeaders });

        // Fire 5 requests simultaneously
        const results = await Promise.allSettled([
            payRequest(), payRequest(), payRequest(), payRequest(), payRequest()
        ]);

        const successful = results.filter(r => r.status === 'fulfilled').length;
        log(`   ℹ️  Launched 5 concurrent payments. Successful: ${successful}`);
        if (successful > 1) {
            log('   ⚠️ INFO: Multiple payments succeeded. Check if this caused overpayment (app logic handles overpayment checks).');
            // Check balance using another endpoint if possible, but manual check recommended.
        }
    } catch (e) {
        log('   ⚠️ Error running concurrency test');
    }

    // 4. MALFORMED JSON / DOS
    log('\n👾 TEST PHASE 4: MALFORMED DATA');
    log('   Testing Malformed JSON...');
    try {
        await axios.post(`${BASE_URL}/auth/login`, "This is not JSON", {
            headers: { 'Content-Type': 'application/json' }
        });
        log('   ❌ FAIL: Server crashed or handled poorly');
    } catch (e) {
        if (e.response && e.response.status >= 400 && e.response.status < 500) {
            log('   ✅ PASS: Handled gracefully');
        } else {
            log(`   ⚠️ Status: ${e.response ? e.response.status : e.message}`);
        }
    }

    log('\n-----------------------------------');
    log('🏁 CHAOS TESTS COMPLETED');
}

runChaosTests();
