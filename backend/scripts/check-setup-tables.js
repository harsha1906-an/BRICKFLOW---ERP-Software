const { runQuery, getAll } = require('../src/config/db');

async function checkTables() {
    try {
        const tables = ['projects', 'materials', 'suppliers', 'purchase_orders'];
        for (const t of tables) {
            console.log(`\n--- Schema: ${t} ---`);
            const cols = await getAll(`PRAGMA table_info(${t})`);
            console.table(cols.map(c => ({ cid: c.cid, name: c.name, type: c.type })));
        }
    } catch (e) {
        console.error(e);
    }
}
checkTables();
