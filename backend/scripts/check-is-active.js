const { getAll } = require('../src/config/db');

async function checkIsActive() {
    try {
        const tables = ['projects', 'units', 'customers', 'suppliers', 'materials', 'labours', 'users'];
        const missing = [];
        for (const t of tables) {
            const cols = await getAll(`PRAGMA table_info(${t})`);
            const hasActive = cols.some(c => c.name === 'is_active');
            console.log(`${t}: ${hasActive ? '✅ is_active found' : '❌ MISSING is_active'}`);
            if (!hasActive) missing.push(t);
        }
        if (missing.length > 0) {
            console.log(`\nNeed migration for: ${missing.join(', ')}`);
        }
    } catch (e) {
        console.error(e);
    }
}
checkIsActive();
