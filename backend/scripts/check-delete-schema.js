const { getAll } = require('../src/config/db');

async function checkSchema() {
    try {
        const tables = ['projects', 'units', 'customers', 'suppliers', 'materials', 'labours', 'purchases'];
        for (const t of tables) {
            console.log(`\n--- Schema: ${t} ---`);
            const cols = await getAll(`PRAGMA table_info(${t})`);
            console.table(cols.map(c => ({ cid: c.cid, name: c.name, type: c.type })));
        }
    } catch (e) {
        console.error(e);
    }
}
checkSchema();
