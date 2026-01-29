const { getAll } = require('../src/config/db');

async function checkUserSchema() {
    try {
        console.log('\n--- Schema: users ---');
        const cols = await getAll(`PRAGMA table_info(users)`);
        console.table(cols.map(c => ({ cid: c.cid, name: c.name, type: c.type, dflt_value: c.dflt_value })));
    } catch (e) {
        console.error(e);
    }
}
checkUserSchema();
