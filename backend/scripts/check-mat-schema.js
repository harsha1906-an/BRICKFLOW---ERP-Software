const { getAll } = require('../src/config/db');

async function checkMaterialSchema() {
    try {
        console.log('\n--- Schema: materials ---');
        const cols = await getAll(`PRAGMA table_info(materials)`);
        console.table(cols.map(c => ({ cid: c.cid, name: c.name, type: c.type })));
    } catch (e) {
        console.error(e);
    }
}
checkMaterialSchema();
