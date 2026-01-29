const { getAll } = require('../src/config/db');

async function checkSchema() {
    try {
        console.log('--- Schema: labours ---');
        const cols = await getAll("PRAGMA table_info(labours)");
        console.table(cols.map(c => ({ cid: c.cid, name: c.name, type: c.type })));
    } catch (e) {
        console.error(e);
    }
}
checkSchema();
